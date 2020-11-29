import { promises as fs } from 'fs'

import { replaceHash } from './replaceHash'

export async function renameFiles(filePaths: readonly string[], hashes: Map<string, string>) {
  const renames: Array<[string, string]> = []

  for (const filePath of filePaths) {
    const hash = hashes.get(filePath)

    if (hash) {
      renames.push([filePath, replaceHash(filePath, hash)])
    }
  }

  await Promise.all(renames.map((args) => fs.rename(...args)))
}
