import { Document } from '@typed/content-hash'
import { promises } from 'fs'
import { dirname, relative, resolve } from 'path'

export async function appendImportMapToAssetManifest(
  webModulesDir: string,
  manifest: Document,
  importMap: Record<string, string>,
) {
  const path = manifest.filePath
  const manifestDir = dirname(path)
  const currentContents = manifest.contents
  const updatedManifest = {
    ...JSON.parse(currentContents),
  }

  for (const [from, to] of Object.entries(importMap)) {
    updatedManifest[from] = relative(manifestDir, resolve(webModulesDir, to))
  }

  await promises.writeFile(path, JSON.stringify(updatedManifest, null, 2))
}
