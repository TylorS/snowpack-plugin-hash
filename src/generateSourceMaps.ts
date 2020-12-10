import remapping from '@ampproject/remapping'
import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import { basename, extname } from 'path'

import { diffMagicString } from './diffMagicString'

export async function generateSourceMaps(
  before: ReadonlyMap<string, string>,
  after: ReadonlyMap<string, string>,
  hashes: ReadonlyMap<string, string>,
): Promise<ReadonlyArray<readonly [string, string]>> {
  return await Promise.all(
    Array.from(before).map(async ([filePath, beforeContent]) => {
      const afterContent = after.get(filePath)!
      const hash = hashes.get(filePath)!
      const ext = extname(filePath)
      const hashedPath = filePath.replace(ext, `.${hash}${ext}`)
      const beforeMap = filePath + '.map'
      const afterMap = hashedPath + '.map'
      const [, afterMapContent] = diffMagicString(basename(hashedPath), beforeContent, afterContent)

      // You might not have generated sourceMaps previously, so we'll at least generate one
      // For our own transformations.
      if (!existsSync(beforeMap)) {
        return [afterMap, afterMapContent] as const
      }

      try {
        const initialSourceMap = await readFile(beforeMap).then((b) => JSON.parse(b.toString()))
        const remapped = remapping([afterMapContent, initialSourceMap], () => null, false)

        return [afterMap, remapped.toString()] as const
      } catch (error) {
        console.info(`Unable to generate remapped source map for`, filePath, error)

        return [afterMap, afterMapContent] as const
      }
    }),
  )
}
