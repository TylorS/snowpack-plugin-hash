import { readdirSync, statSync } from 'fs'
import { join } from 'path'

export function readAllFiles(directory: string): ReadonlyArray<string> {
  const contents = readdirSync(directory).map((n) => join(directory, n))
  const fileNames = contents.filter((p) => statSync(p).isFile())
  const directoryNames = contents.filter((p) => statSync(p).isDirectory())

  return [...fileNames, ...directoryNames.flatMap(readAllFiles)]
}
