import { extname } from 'path'
import { SnowpackConfig, SnowpackPlugin } from 'snowpack'
import { Project } from 'ts-morph'

import { createFileReference } from './createFileReference'
import { readAllFiles } from './readAllFiles'
import { renameFiles } from './renameFiles'
import { updateExportDeclarations } from './updateExportDeclarations'
import { updateHtmlFiles } from './updateHtmlFiles'
import { updateImportDeclarations } from './updateImportDeclarations'

const DEFAULT_HASH_LENGTH = 12

const supportedSourceFileExtensions = ['.js', '.jsx']

const plugin = (_: SnowpackConfig, pluginOptions: plugin.PluginOptions = {}): SnowpackPlugin => {
  const { tsConfig = 'tsconfig.json', hashLength = DEFAULT_HASH_LENGTH } = pluginOptions
  const project = new Project({
    tsConfigFilePath: tsConfig,
    compilerOptions: { allowJs: true },
    addFilesFromTsConfig: false,
  })

  return {
    name: 'snowpack-plugin-hash',
    optimize: async (options) => {
      // Find all the relevant files
      const allFiles = readAllFiles(options.buildDirectory)
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

      // Update SourceFiles with hashes
      updateImportDeclarations(sourceFiles, hashes)
      updateExportDeclarations(sourceFiles, hashes)
      await Promise.all(sourceFiles.map((s) => s.save()))

      // Rename files on disk to also have hashes
      await renameFiles(sourceFiles, hashes)

      // Update HTML file references
      await updateHtmlFiles(htmlFiles, hashes, options.buildDirectory)

      // TODO: remap sourcemaps to reflect new changes
    },
  }
}

namespace plugin {
  export type PluginOptions = {
    readonly tsConfig?: string
    readonly hashLength?: number
  }
}

export = plugin
