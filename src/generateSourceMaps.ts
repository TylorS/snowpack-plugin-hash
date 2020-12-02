import remapping from '@ampproject/remapping'
import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import MagicString from 'magic-string'
import { basename, dirname, extname, relative } from 'path'

export async function generateSourceMaps(
  before: ReadonlyMap<string, string>,
  after: ReadonlyMap<string, string>,
  hashes: ReadonlyMap<string, string>,
): Promise<ReadonlyArray<readonly [string, string]>> {
  return await Promise.all(
    Array.from(before).map(async ([filePath, beforeContent]) => {
      const rewrite = rewriteSource(filePath)
      const afterContent = after.get(filePath)!
      const hash = hashes.get(filePath)!
      const ext = extname(filePath)

      const hashedPath = filePath.replace(ext, `.${hash}${ext}`)

      let ms = new MagicString(beforeContent, {
        filename: basename(filePath),
        indentExclusionRanges: [],
      })

      ms = ms.overwrite(0, ms.length(), afterContent, { storeName: true, contentOnly: false })

      const beforeMap = filePath + '.map'
      const afterMap = hashedPath + '.map'
      const afterMapContent = ms
        .generateMap({
          hires: true,
          file: basename(hashedPath),
          source: beforeContent,
          includeContent: true,
        })
        .toString()

      // You might not have generated sourceMaps previously, so we'll at least generate one
      // For our own transformations.
      if (!existsSync(beforeMap)) {
        return [afterMap, afterMapContent] as const
      }

      try {
        const initialSourceMap = await readFile(beforeMap).then((b) => JSON.parse(b.toString()))
        const hashedSourceMap = JSON.parse(afterMapContent)

        const remapped = remapping([hashedSourceMap, initialSourceMap], () => null, false)

        remapped.sources = remapped.sources.map((s) => (s ? rewrite(s) : s))

        return [afterMap, remapped.toString()] as const
      } catch (error) {
        console.info(`Unable to generate remapped source map for`, filePath, error)

        return [afterMap, afterMapContent] as const
      }
    }),
  )
}

function rewriteSource(filePath: string) {
  return (source: string) => relative(dirname(filePath), source)
}
