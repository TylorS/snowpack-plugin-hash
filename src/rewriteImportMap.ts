import { FileExtension, FilePath, Hashes, replaceHash } from '@typed/content-hash'
import { readFile, writeFile } from 'fs/promises'
import { dirname, relative, resolve } from 'path'

import { getFileExtension } from './getFileExtension'

export async function rewriteImportMap(importMapPath: string, hashes: Hashes['hashes']) {
  const directory = dirname(importMapPath)
  const importMap = await readFile(importMapPath).then((b) => JSON.parse(b.toString()))

  for (const [inputPath, outputPath] of Object.entries<string>(importMap.imports)) {
    const out = FilePath.wrap(resolve(directory, outputPath))
    const hash = hashes.get(out)

    if (hash) {
      importMap.imports[inputPath] = relative(
        directory,
        FilePath.unwrap(replaceHash(out, FileExtension.wrap(getFileExtension(outputPath)), hash)),
      )
    }
  }

  await writeFile(importMapPath, JSON.stringify(importMap, null, 2))

  return importMap.imports as Record<string, string>
}
