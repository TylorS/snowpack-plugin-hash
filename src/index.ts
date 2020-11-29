import { existsSync } from 'fs'
import { extname, join } from 'path'
import { SnowpackConfig, SnowpackPlugin } from 'snowpack'
import { Project } from 'ts-morph'

import { createFileReference } from './createFileReference'
import { deleteSourceMaps } from './deleteSourceMaps'
import { generateAssetManifest } from './generateAssetManifest'
import { generateSourceMaps } from './generateSourceMaps'
import { getFileSnapshot } from './getFileSnapshot'
import { readAllFiles } from './readAllFiles'
import { renameFiles } from './renameFiles'
import { rewriteCssHashes } from './rewriteCssHashes'
import { rewriteExportDeclarations } from './rewriteExportDeclarations'
import { rewriteHtmlFiles } from './rewriteHtmlFiles'
import { rewriteImportDeclarations } from './rewriteImportDeclarations'
import { rewriteImportMap } from './rewriteImportMap'
import { rewriteSourceMapUrls } from './rewriteSourceMapUrls'
import { writeAllFiles } from './writeAllFiles'

const DEFAULT_HASH_LENGTH = 12
const DEFAULT_ASSET_MANIFEST = 'asset-manifest.json'

const jsFileExtensions = ['.js', '.jsx']
const prefix = '[snowpack-plugin-hash]'

const plugin = (
  config: SnowpackConfig,
  pluginOptions: plugin.PluginOptions = {},
): SnowpackPlugin => {
  const {
    tsConfig,
    hashLength = DEFAULT_HASH_LENGTH,
    assetManifest = DEFAULT_ASSET_MANIFEST,
  } = pluginOptions
  const project = new Project({
    tsConfigFilePath: tsConfig,
    compilerOptions: { allowJs: true },
    addFilesFromTsConfig: false,
  })

  return {
    name: 'snowpack-plugin-hash',
    optimize: async (options) => {
      const metaDir = join(options.buildDirectory, config.buildOptions.metaDir)
      const webModulesDir = join(options.buildDirectory, config.buildOptions.webModulesUrl)
      const allFiles = readAllFiles(options.buildDirectory).filter((f) => !f.includes(metaDir))

      // Find all the files we know how to apply hashes to
      const jsFiles = allFiles
        .filter((f) => jsFileExtensions.includes(extname(f)))
        .map((f) => project.addSourceFileAtPath(f))
      const cssFiles = allFiles.filter((f) => extname(f) === '.css')
      const allFilePaths = [...jsFiles.map((s) => s.getFilePath()), ...cssFiles]

      if (allFilePaths.length === 0) {
        console.info(prefix, 'No supported files found to apply content hashes.')

        return
      }

      // Get an initial snapshot of all our files
      const initialSnapshot = await getFileSnapshot(allFilePaths)

      // Generate a map of all the hashes
      console.info(prefix, 'Generating Hashes...')
      const hashes = new Map(
        await Promise.all(
          allFilePaths.map((filePath) =>
            createFileReference(filePath, initialSnapshot.get(filePath)!, hashLength),
          ),
        ),
      )

      // Update JavaScript Files with hashes
      if (jsFiles.length > 0) {
        console.info(prefix, 'Rewriting JavaScript files...')

        rewriteImportDeclarations(jsFiles, hashes)
        rewriteExportDeclarations(jsFiles, hashes)
        rewriteSourceMapUrls(jsFiles, hashes)

        await Promise.all(jsFiles.map((s) => s.save()))
      }

      // Update CSS Files with hashes
      if (cssFiles.length > 0) {
        console.info(prefix, 'Rewriting CSS files...')

        await rewriteCssHashes(options.buildDirectory, cssFiles, initialSnapshot, hashes)
      }

      // Get a snapshot of all of the updated source files
      const updatedSnapshot = await getFileSnapshot(allFilePaths)

      // Rename files on disk to also have hashes
      await renameFiles(allFilePaths, hashes)

      // Update HTML file references
      const htmlFiles = allFiles.filter((f) => extname(f) === '.html')

      if (htmlFiles.length > 0) {
        console.info(prefix, 'Rewriting HTML imports...')

        await rewriteHtmlFiles(htmlFiles, hashes, options.buildDirectory)
      }

      // Generate SourceMaps for hash additions
      console.info(prefix, 'Generating SourceMaps...')
      await writeAllFiles(await generateSourceMaps(initialSnapshot, updatedSnapshot, hashes))

      // Delete previously-created sourceMaps
      await deleteSourceMaps(allFilePaths)

      // Try to rewrite the import map with hashes
      const importMapPath = join(webModulesDir, 'import-map.json')

      let importMap: Record<string, string> | null = null
      if (existsSync(importMapPath)) {
        console.info(prefix, 'Rewriting Import Map...')
        importMap = await rewriteImportMap(importMapPath, webModulesDir, hashes)
      }

      console.info(prefix, `Generating Asset Manifest [${assetManifest}]...`)

      // Generate an asset manifest for all files at configured path
      await generateAssetManifest(
        options.buildDirectory,
        webModulesDir,
        join(options.buildDirectory, assetManifest),
        importMap || {},
        hashes,
      )
    },
  }
}

namespace plugin {
  export type PluginOptions = {
    readonly tsConfig?: string
    readonly hashLength?: number
    readonly assetManifest?: string
  }
}

export = plugin
