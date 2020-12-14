const regexes = ['.js.map.proxy.js', '.js.map', '.d.ts', '.d.ts.map'].map(
  (p) => new RegExp(`${p}$`),
)

export function getHashedPath(path: string) {
  for (const regex of regexes) {
    if (regex.test(path)) {
      return path.replace(regex, '.js')
    }
  }

  return path
}
