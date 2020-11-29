import { existsSync } from 'fs'
import { unlink } from 'fs/promises'

export const deleteSourceMaps = (allFilePaths: readonly string[]) =>
  Promise.all(
    allFilePaths.filter((path) => existsSync(path + '.map')).map((path) => unlink(path + '.map')),
  )
