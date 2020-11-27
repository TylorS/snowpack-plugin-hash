import { generateHash } from './generateHash'

export function createFileReference(
  file: string,
  contents: string,
  hashLength: number,
): readonly [string, string] {
  return [file, generateHash(contents, hashLength)]
}
