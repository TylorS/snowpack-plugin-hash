import { readFile, writeFile } from 'fs/promises'
import { extname, relative } from 'path'
import postHtml from 'posthtml'
// Issues with its Typescript Types
// eslint-disable-next-line @typescript-eslint/no-var-requires
const rewritePaths = require('posthtml-rewrite-paths').default

export async function updateHtmlFiles(
  htmlFiles: readonly string[],
  hashes: Map<string, string>,
  buildDirectory: string,
) {
  const pathMap = Object.fromEntries([...hashes.entries()].map(remapMounts(buildDirectory)))
  const rewrite = postHtml([rewritePaths({ pathMap })])

  for (const htmlFile of htmlFiles) {
    const buffer = await readFile(htmlFile)
    const { html } = await rewrite.process(buffer.toString())

    await writeFile(htmlFile, html)
  }
}

function remapMounts(buildDirectory: string) {
  return ([from, hash]: [string, string]): [string, string] => {
    const ext = extname(from)
    const to = from.replace(ext, `.${hash}${ext}`)

    return [remapMount(buildDirectory, from), remapMount(buildDirectory, to)]
  }
}

function remapMount(buildDirectory: string, path: string): string {
  return '/' + relative(buildDirectory, path)
}
