import remapping from '@ampproject/remapping'
import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import { basename } from 'path'

import { diffMagicString } from './diffMagicString'
import { getHashedPath } from './getHashedPath'
import { replaceHash } from './replaceHash'

export async function generateSourceMaps(
  before: ReadonlyMap<string, string>,
  after: ReadonlyMap<string, string>,
  hashes: ReadonlyMap<string, string>,
): Promise<ReadonlyArray<readonly [string, string]>> {
  return await Promise.all(
    Array.from(before).map(async ([filePath, beforeContent]) => {
      const hashPath = getHashedPath(filePath)
      const hash = hashes.get(hashPath)!
      const hashedPath = replaceHash(filePath, hash)
      const afterContent = after.get(filePath)!
      const [, afterMapContent] = diffMagicString(basename(hashedPath), beforeContent, afterContent)

      const beforeMap = filePath + '.map'
      const afterMap = hashedPath + '.map'

      // You might not have generated sourceMaps previously, so we'll at least generate one
      // For our own transformations.
      if (!existsSync(beforeMap)) {
        return [afterMap, afterMapContent] as const
      }

      const initialSourceMap = await readFile(beforeMap).then((b) => b.toString())

      // You might not have generated sourceMaps previously, so we'll at least generate one
      // For our own transformations.
      if (!initialSourceMap) {
        return [afterMap, afterMapContent] as const
      }

      if (!afterMapContent) {
        return [afterMap, initialSourceMap] as const
      }

      try {
        const remapped = remapping([afterMapContent, initialSourceMap], () => null, false)

        return [afterMap, remapped.toString()] as const
      } catch (error) {
        console.info('Unable to remap source map', filePath)
        console.info('initial', initialSourceMap)
        console.info('updated', afterMapContent)

        const contents = JSON.parse(afterContent).mappings ? afterMapContent : initialSourceMap

        return [afterMap, contents] as const
      }
    }),
  )
}
