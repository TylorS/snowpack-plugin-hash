import { promises as fs } from 'fs'
import { extname } from 'path'

export async function renameFiles(filePaths: readonly string[], hashes: Map<string, string>) {
  const renames: Array<[string, string]> = []

  for (const filePath of filePaths) {
    const hash = hashes.get(filePath)
    const ext = extname(filePath)

    if (hash) {
      renames.push([filePath, filePath.replace(ext, `.${hash}${ext}`)])
    }
  }

  await Promise.all(renames.map((args) => fs.rename(...args)))
}
