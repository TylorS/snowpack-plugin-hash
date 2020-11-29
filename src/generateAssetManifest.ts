import { writeFile } from 'fs/promises'
import { join, relative } from 'path'

import { replaceHash } from './replaceHash'

export async function generateAssetManifest(
  outputDir: string,
  webModulesDir: string,
  filePath: string,
  importMap: Record<string, string>,
  hashes: Map<string, string>,
) {
  const assets: Record<string, string> = {}
  const toWebModules = relative(outputDir, webModulesDir)

  for (const [path, hash] of hashes) {
    const relativePath = relative(outputDir, path)

    assets[relativePath] = replaceHash(relativePath, hash)
  }

  for (const [from, to] of Object.entries(importMap)) {
    assets[from] = join(toWebModules, to)
  }

  await writeFile(filePath, JSON.stringify({ assets }, null, 2))
}
