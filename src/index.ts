import {
  contentHashDirectory,
  createDefaultPlugins,
  fsReadFile,
  LoggerEnv,
  LogLevel,
} from '@typed/content-hash'
import { log, provideAll, toPromise } from '@typed/fp'
import { pipe } from 'fp-ts/lib/function'
import { getOrElse, map } from 'fp-ts/lib/Option'
import { existsSync } from 'fs'
import { join, resolve } from 'path'
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

const plugin = (_: SnowpackConfig, pluginOptions: plugin.PluginOptions = {}): SnowpackPlugin => {
  const compilerOptions = pipe(
    findTsConfig({
      directory: process.cwd(),
      configFileName: pluginOptions.tsConfig,
    }),
    map((t) => t.compilerOptions),
    getOrElse(getDefaultCompilerOptions),
  )
  const hashLength = pluginOptions.hashLength ?? DEFAULT_HASH_LENGTH
  const loggerEnv: LoggerEnv = {
    logLevel: LogLevel.Info,
    logPrefix,
    logger: (msg: string) => pipe(msg, log, provideAll({ console })),
  }

  return {
    name: 'snowpack-plugin-hash',
    optimize: async (options) => {
      const assetManifestFileName = pluginOptions.assetManifest ?? DEFAULT_ASSET_MANIFEST
      const registry = await contentHashDirectory({
        directory: options.buildDirectory,
        plugins: createDefaultPlugins({ ...options, compilerOptions }),
        hashLength,
        assetManifest: assetManifestFileName,
        baseUrl: pluginOptions.baseUrl,
        logPrefix,
      })

      // Try to rewrite the import map with hashes
      const webModulesDir = join(options.buildDirectory, 'web_modules')
      const importMapPath = join(webModulesDir, 'import-map.json')

      if (existsSync(importMapPath)) {
        log(`${yellow('!')} Rewriting Import Map...`)

        const importMap = await rewriteImportMap(importMapPath, registry, hashLength)

        log(`${yellow('!')} Rewriting Asset Manifest [${assetManifestFileName}]...`)

        const document = await pipe(
          fsReadFile(resolve(options.buildDirectory, assetManifestFileName), {
            supportsSourceMaps: false,
            isBase64Encoded: false,
          }),
          provideAll(loggerEnv),
          toPromise,
        )

        // Generate an asset manifest for all files at configured path
        await appendImportMapToAssetManifest(webModulesDir, document, importMap)
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
