import remapping from '@ampproject/remapping'
import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import MagicString from 'magic-string'
import { basename, extname } from 'path'

export async function generateSourceMaps(
  initialCopies: Map<string, string>,
  updatedFiles: Map<string, string>,
  hashes: Map<string, string>,
): Promise<ReadonlyArray<readonly [string, string]>> {
  return await Promise.all(
    Array.from(initialCopies).map(async ([filePath, initialContent]) => {
      const updatedContent = updatedFiles.get(filePath)!
      const hash = hashes.get(filePath)!
      const ext = extname(filePath)

      const hashedPath = filePath.replace(ext, `.${hash}${ext}`)

      let ms = new MagicString(initialContent, {
        filename: basename(filePath),
        indentExclusionRanges: [],
      })

      ms = ms.overwrite(0, ms.length(), updatedContent, { storeName: true, contentOnly: false })

      const sourceMapPath = filePath + '.map'
      const outputPath = hashedPath + '.map'

      // You might not have generated sourceMaps previously, so we'll at least generate one
      // For our own transformations.
      if (!existsSync(sourceMapPath)) {
        return [
          outputPath,
          ms
            .generateMap({
              hires: true,
              file: basename(hashedPath),
              source: initialContent,
            })
            .toString(),
        ] as const
      }

      const initialSourceMap = await readFile(sourceMapPath).then((b) => JSON.parse(b.toString()))
      const hashedSourceMap = JSON.parse(
        ms
          .generateMap({
            hires: true,
            file: basename(hashedPath),
          })
          .toString(),
      )

      const remapped = remapping([hashedSourceMap, initialSourceMap], () => null, false)

      return [outputPath, remapped.toString()] as const
    }),
  )
}
