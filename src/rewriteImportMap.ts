import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'

import { replaceHash } from './replaceHash'

export async function rewriteImportMap(
  importMapPath: string,
  directory: string,
  hashes: Map<string, string>,
) {
  const importMap = await readFile(importMapPath).then((b) => JSON.parse(b.toString()))

  for (const [inputPath, outputPath] of Object.entries<string>(importMap.imports)) {
    importMap.imports[inputPath] = rewritePath(directory, outputPath, hashes)
  }

  await writeFile(importMapPath, JSON.stringify(importMap, null, 2))

  return importMap.imports as Record<string, string>
}

function rewritePath(directory: string, outputPath: string, hashes: Map<string, string>): string {
  const fullPath = join(directory, outputPath)
  const hash = hashes.get(fullPath)

  return hash ? replaceHash(outputPath, hash) : outputPath
}
