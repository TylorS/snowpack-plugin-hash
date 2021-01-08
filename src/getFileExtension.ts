import { extname } from 'path'

const regexes = Object.fromEntries(
  ['.js.map.proxy.js', '.js.map', '.d.ts', '.d.ts.map'].map(
    (p) => [p, new RegExp(`${p}$`)] as const,
  ),
)

export function getFileExtension(path: string) {
  for (const [ext, regex] of Object.entries(regexes)) {
    if (regex.test(path)) {
      return ext
    }
  }

  return extname(path)
}
