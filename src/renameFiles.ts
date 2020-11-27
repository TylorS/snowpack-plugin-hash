import { promises as fs } from 'fs'
import { extname } from 'path'
import { SourceFile } from 'ts-morph'

export async function renameFiles(
  sourcesFiles: readonly SourceFile[],
  hashes: Map<string, string>,
) {
  const renames: Array<[string, string]> = []

  for (const sourceFile of sourcesFiles) {
    const filePath = sourceFile.getFilePath()
    const hash = hashes.get(filePath)
    const ext = extname(filePath)

    if (hash) {
      renames.push([filePath, filePath.replace(ext, `.${hash}${ext}`)])
    }
  }

  await Promise.all(renames.map((args) => fs.rename(...args)))
}
