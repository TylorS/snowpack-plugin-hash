import { dirname, extname, relative } from 'path'

import { makeAbsolute } from './makeAbsolute'

export function generatePathMap(
  buildDirectory: string,
  baseUrl: string,
  hashes: ReadonlyMap<string, string>,
  filePath: string,
): Record<string, string> {
  return Object.fromEntries(
    Array.from(hashes).flatMap(applyRemounts(buildDirectory, baseUrl, filePath)),
  )
}

function applyRemounts(buildDirectory: string, baseUrl: string, path: string) {
  return ([from, hash]: [string, string]): ReadonlyArray<readonly [string, string]> => {
    const ext = extname(from)
    const to = from.replace(ext, `.${hash}${ext}`)

    return [
      [
        applyBase(baseUrl, absoluteRemount(buildDirectory, from)),
        applyBase(baseUrl, absoluteRemount(buildDirectory, to)),
      ],
      [
        ensureRelative(relative(dirname(path), makeAbsolute(buildDirectory, from))),
        ensureRelative(relative(dirname(path), makeAbsolute(buildDirectory, to))),
      ],
    ]
  }
}

function absoluteRemount(buildDirectory: string, path: string): string {
  return '/' + relative(buildDirectory, path)
}

function ensureRelative(path: string): string {
  if (path[0] === '.') {
    return path
  }

  return './' + path
}

function applyBase(baseUrl: string, path: string) {
  return baseUrl + path.slice(1)
}
