import {
  contentHashDirectory,
  createDefaultPlugins,
  fsReadFile,
  LoggerEnv,
  LogLevel,
} from '@typed/content-hash'
import { findTsConfig } from '@typed/content-hash/lib/cli/findTsConfig'
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
import { rewriteImportMap } from './rewriteImportMap'

const DEFAULT_HASH_LENGTH = 12
const DEFAULT_ASSET_MANIFEST = 'asset-manifest.json'

const logPrefix = gray('[snowpack-plugin-hash]')

const possibleModuleDirs = ['_snowpack/pkg', 'web_modules']

const getWebModulesDir = (buildDirectory: string) => {
  for (const dir of possibleModuleDirs.map((d) => join(buildDirectory, d))) {
    if (existsSync(dir)) {
      return dir
    }
  }

  return possibleModuleDirs[0]
}

function getLogLevel(option?: string) {
  switch (option) {
    case 'debug':
      return LogLevel.Debug
    case 'error':
      return LogLevel.Error
    default:
      return LogLevel.Info
  }
}

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
  const assetManifest = pluginOptions.assetManifest ?? DEFAULT_ASSET_MANIFEST
  const baseUrl =
    pluginOptions.baseUrl ?? (_.buildOptions.baseUrl === '/' ? undefined : _.buildOptions.baseUrl)
  const sourceMaps = pluginOptions.sourceMaps ?? _.buildOptions.sourcemap

  return {
    name: 'snowpack-plugin-hash',
    optimize: async (options) => {
      const registry = await contentHashDirectory({
        directory: options.buildDirectory,
        plugins: createDefaultPlugins({
          buildDirectory: options.buildDirectory,
          mainFields: pluginOptions.mainFields,
          compilerOptions,
        }),
        hashLength,
        assetManifest,
        baseUrl,
        logPrefix,
        logLevel: getLogLevel(pluginOptions.logLevel),
        registryFile: pluginOptions.registryFile,
        sourceMaps,
      })

      // Try to rewrite the import map with hashes
      const webModulesDir = getWebModulesDir(options.buildDirectory)
      const importMapPath = join(webModulesDir, 'import-map.json')

      if (existsSync(importMapPath)) {
        log(`${yellow('!')} Rewriting Import Map...`)

        const importMap = await rewriteImportMap(importMapPath, registry, hashLength)

        log(`${yellow('!')} Rewriting Asset Manifest [${assetManifest}]...`)

        const document = await pipe(
          fsReadFile(resolve(options.buildDirectory, assetManifest), {
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
    readonly logLevel?: 'info' | 'error' | 'debug'
    readonly registryFile?: string
    readonly sourceMaps?: boolean
    readonly mainFields?: readonly string[]
  }
}

export = plugin
