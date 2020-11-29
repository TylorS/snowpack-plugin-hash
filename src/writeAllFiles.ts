import { writeFile } from 'fs/promises'

export const writeAllFiles = (filesToContent: ReadonlyArray<readonly [string, string]>) =>
  Promise.all(filesToContent.map(([filePath, content]) => writeFile(filePath, content)))
