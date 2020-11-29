import { readFile, writeFile } from 'fs/promises'
import postHtml from 'posthtml'

import { generatePathMap } from './generatePathMap'
// Issues with its Typescript Types
// eslint-disable-next-line @typescript-eslint/no-var-requires
const rewritePaths = require('posthtml-rewrite-paths').default

export async function updateHtmlFiles(
  htmlFiles: readonly string[],
  hashes: Map<string, string>,
  buildDirectory: string,
) {
  await Promise.all(
    htmlFiles.map(async (htmlFile) => {
      const pathMap = generatePathMap(buildDirectory, hashes, htmlFile)
      const rewrite = postHtml([rewritePaths({ pathMap })])

      const buffer = await readFile(htmlFile)
      const { html } = await rewrite.process(buffer.toString())

      await writeFile(htmlFile, html)
    }),
  )
}
