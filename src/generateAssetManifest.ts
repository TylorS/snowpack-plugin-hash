import { writeFile } from 'fs/promises'
import { extname, join, relative } from 'path'

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
    const ext = extname(relativePath)

    assets[relativePath] = relativePath.replace(ext, `.${hash}${ext}`)
  }

  for (const [from, to] of Object.entries(importMap)) {
    assets[from] = join(toWebModules, to)
  }

  await writeFile(filePath, JSON.stringify({ assets }, null, 2))
}
