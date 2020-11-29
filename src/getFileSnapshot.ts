import { readFile } from 'fs/promises'

export const getFileSnapshot = async (
  filePaths: readonly string[],
): Promise<ReadonlyMap<string, string>> => {
  return new Map(
    await Promise.all([
      ...filePaths.map((filePath) =>
        readFile(filePath).then((b) => [filePath, b.toString()] as const),
      ),
    ]),
  )
}
