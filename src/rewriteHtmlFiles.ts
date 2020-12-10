import { readFile, writeFile } from 'fs/promises'
import postHtml from 'posthtml'

import { generatePathMap } from './generatePathMap'
// Issues with its Typescript Types
// eslint-disable-next-line @typescript-eslint/no-var-requires
const rewritePaths = require('posthtml-rewrite-paths').default

const search = { script: ['src'], link: ['href'] }

export async function rewriteHtmlFiles(
  htmlFiles: readonly string[],
  hashes: Map<string, string>,
  buildDirectory: string,
  baseUrl: string,
) {
  await Promise.all(
    htmlFiles.map(async (htmlFile) => {
      const pathMap = generatePathMap(buildDirectory, baseUrl, hashes, htmlFile)
      const rewrite = postHtml([rewritePaths({ search, pathMap })])

      const buffer = await readFile(htmlFile)
      const { html } = await rewrite.process(buffer.toString())

      await writeFile(htmlFile, html)
    }),
  )
}
