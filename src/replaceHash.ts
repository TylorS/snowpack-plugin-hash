import { extname } from 'path'

export function replaceHash(filePath: string, hash: string) {
  const ext = extname(filePath)

  return filePath.replace(new RegExp(`${ext}$`), `.${hash}${ext}`)
}
