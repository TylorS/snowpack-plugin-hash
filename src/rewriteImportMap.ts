import { DocumentRegistry, getContentHash, replaceHash } from '@typed/content-hash'
import { isSome } from 'fp-ts/lib/Option'
import { readFile, writeFile } from 'fs/promises'
import { dirname, relative, resolve } from 'path'

import { getFileExtension } from './getFileExtension'

export async function rewriteImportMap(
  importMapPath: string,
  registry: DocumentRegistry,
  hashLength: number,
) {
  const directory = dirname(importMapPath)
  const importMap = await readFile(importMapPath).then((b) => JSON.parse(b.toString()))

  for (const [inputPath, outputPath] of Object.entries<string>(importMap.imports)) {
    const out = resolve(directory, outputPath)
    const document = registry.get(out)

    if (document) {
      const hash = getContentHash(document, registry, hashLength)

      if (isSome(hash)) {
        importMap.imports[inputPath] = relative(
          directory,
          replaceHash(out, getFileExtension(outputPath), hash.value),
        )
      }
    }
  }

  await writeFile(importMapPath, JSON.stringify(importMap, null, 2))

  return importMap.imports as Record<string, string>
}
