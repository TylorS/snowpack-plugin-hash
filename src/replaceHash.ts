import { extname } from 'path'

const mapProxyRegex = new RegExp(`.js.map.proxy.js$`)
const jsMapRegex = new RegExp(`.js.map$`)

const dtsRegex = new RegExp(`.d.ts$`)
const dtsMapRegex = new RegExp(`.d.ts.map$`)

export function replaceHash(filePath: string, hash: string) {
  if (mapProxyRegex.test(filePath)) {
    return filePath.replace(mapProxyRegex, `.${hash}.js.map.proxy.js`)
  }

  if (jsMapRegex.test(filePath)) {
    return filePath.replace(jsMapRegex, `.${hash}.js.map`)
  }

  if (dtsRegex.test(filePath)) {
    return filePath.replace(mapProxyRegex, `.${hash}.d.ts`)
  }

  if (dtsMapRegex.test(filePath)) {
    return filePath.replace(jsMapRegex, `.${hash}.d.ts.map`)
  }

  const ext = extname(filePath)

  return filePath.replace(new RegExp(`${ext}$`), `.${hash}${ext}`)
}
