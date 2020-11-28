import { existsSync } from 'fs'
import { readFile, unlink, writeFile } from 'fs/promises'
import { extname, join } from 'path'
import { SnowpackConfig, SnowpackPlugin } from 'snowpack'
import { Project } from 'ts-morph'

import { createFileReference } from './createFileReference'
// eslint-disable-next-line import/namespace
import { generateAssetManifest } from './generateAssetManifest'
import { generateSourceMaps } from './generateSourceMaps'
import { readAllFiles } from './readAllFiles'
import { renameFiles } from './renameFiles'
import { rewriteImportMap } from './rewriteImportMap'
import { rewriteSourceMapUrls } from './rewriteSourceMapUrls'
import { updateExportDeclarations } from './updateExportDeclarations'
import { updateHtmlFiles } from './updateHtmlFiles'
import { updateImportDeclarations } from './updateImportDeclarations'

const DEFAULT_HASH_LENGTH = 12
const DEFAULT_ASSET_MANIFEST = 'asset-manifest.json'

const supportedSourceFileExtensions = ['.js', '.jsx']

const plugin = (
  config: SnowpackConfig,
  pluginOptions: plugin.PluginOptions = {},
): SnowpackPlugin => {
  const {
    tsConfig = 'tsconfig.json',
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
      try {
        const metaDir = join(options.buildDirectory, config.buildOptions.metaDir)
        const webModulesDir = join(options.buildDirectory, config.buildOptions.webModulesUrl)

        // Find all the relevant files
        const allFiles = readAllFiles(options.buildDirectory).filter((f) => !f.includes(metaDir))
        const sourceFiles = allFiles
          .filter((f) => supportedSourceFileExtensions.includes(extname(f)))
          .map((f) => project.addSourceFileAtPath(f))
        const htmlFiles = allFiles.filter((f) => extname(f) === '.html')

        // Generate a map of all the hashes
        const hashes = new Map(
          await Promise.all(
            sourceFiles.map((sourceFile) =>
              createFileReference(sourceFile.getFilePath(), sourceFile.print(), hashLength),
            ),
          ),
        )

        // Get a snapshot of all the files right now
        const initialCopies = new Map(
          await Promise.all(
            sourceFiles.map((sourceFile) =>
              readFile(sourceFile.getFilePath()).then(
                (b) => [sourceFile.getFilePath(), b.toString()] as const,
              ),
            ),
          ),
        )

        // Update SourceFiles with hashes
        updateImportDeclarations(sourceFiles, hashes)
        updateExportDeclarations(sourceFiles, hashes)
        rewriteSourceMapUrls(sourceFiles, hashes)
        await Promise.all(sourceFiles.map((s) => s.save()))

        // Get a snapshot of all of the updated source files
        const updatedFiles = new Map(
          await Promise.all(
            sourceFiles.map((sourceFile) =>
              readFile(sourceFile.getFilePath()).then(
                (b) => [sourceFile.getFilePath(), b.toString()] as const,
              ),
            ),
          ),
        )

        // Rename files on disk to also have hashes
        await renameFiles(sourceFiles, hashes)

        // Update HTML file references
        await updateHtmlFiles(htmlFiles, hashes, options.buildDirectory)

        // Generate SourceMaps for hash additions
        const sourceMaps = await generateSourceMaps(initialCopies, updatedFiles, hashes)
        await Promise.all(sourceMaps.map(([filePath, map]) => writeFile(filePath, map)))

        // Delete previous source maps
        await Promise.all(
          sourceFiles
            .filter((s) => existsSync(s.getFilePath() + '.map'))
            .map((s) => unlink(s.getFilePath() + '.map')),
        )

        // Try to rewrite the import map with hashes
        const importMap = await rewriteImportMap(webModulesDir, hashes)

        // Generate an asset manifest for all files at configured path
        await generateAssetManifest(
          options.buildDirectory,
          webModulesDir,
          join(options.buildDirectory, assetManifest),
          importMap,
          hashes,
        )
      } catch (error) {
        console.info(error)
      }
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
