import { defaultPlugins, rewriteDirectory } from '@typed/content-hash'
import { pipe } from 'fp-ts/function'
import { getOrElse, map } from 'fp-ts/Option'
import { existsSync } from 'fs'
import { join } from 'path'
import { SnowpackConfig, SnowpackPlugin } from 'snowpack'
import { gray, green, yellow } from 'typed-colors'
import { tick } from 'typed-figures'
import { getDefaultCompilerOptions } from 'typescript'

import { appendImportMapToAssetManifest } from './appendImportMapToAssetManifest'
import { findTsConfig } from './findTsConfig'
import { rewriteImportMap } from './rewriteImportMap'

const DEFAULT_HASH_LENGTH = 12
const DEFAULT_ASSET_MANIFEST = 'asset-manifest.json'

const logPrefix = gray('[snowpack-plugin-hash]')

const log = (msg: string) => console.info(logPrefix, msg)

const plugin = (
  config: SnowpackConfig,
  pluginOptions: plugin.PluginOptions = {},
): SnowpackPlugin => {
  const compilerOptions = pipe(
    findTsConfig({
      directory: process.cwd(),
      configFileName: pluginOptions.tsConfig,
    }),
    map((t) => t.compilerOptions),
    getOrElse(getDefaultCompilerOptions),
  )

  return {
    name: 'snowpack-plugin-hash',
    optimize: async (options) => {
      const assetManifestFileName = pluginOptions.assetManifest ?? DEFAULT_ASSET_MANIFEST
      const { assetManifest, hashes } = await rewriteDirectory({
        directory: options.buildDirectory,
        plugins: defaultPlugins,
        hashLength: pluginOptions.hashLength ?? DEFAULT_HASH_LENGTH,
        pluginEnv: {
          compilerOptions,
        },
        assetManifest: assetManifestFileName,
        baseUrl: pluginOptions.baseUrl,
        logPrefix,
      })

      // Try to rewrite the import map with hashes
      const webModulesDir = join(options.buildDirectory, config.buildOptions.webModulesUrl)
      const importMapPath = join(webModulesDir, 'import-map.json')

      if (existsSync(importMapPath)) {
        log(`${yellow('!')} Rewriting Import Map...`)

        const importMap = await rewriteImportMap(importMapPath, hashes)

        log(`${yellow('!')} Rewriting Asset Manifest [${assetManifestFileName}]...`)

        // Generate an asset manifest for all files at configured path
        await appendImportMapToAssetManifest(webModulesDir, assetManifest, importMap)
      }

      log(`${green(tick)} Complete`)
    },
  }
}

namespace plugin {
  export type PluginOptions = {
    readonly tsConfig?: string
    readonly hashLength?: number
    readonly assetManifest?: string
    readonly baseUrl?: string
  }
}

export = plugin
