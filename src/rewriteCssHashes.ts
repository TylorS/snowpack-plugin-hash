import { writeFile } from 'fs/promises'

import { generatePathMap } from './generatePathMap'

export function rewriteCssHashes(
  buildDirectory: string,
  baseUrl: string,
  cssFiles: readonly string[],
  snapshot: ReadonlyMap<string, string>,
  hashes: ReadonlyMap<string, string>,
) {
  return Promise.all(
    cssFiles.map(async (cssFile) => {
      const pathMap = generatePathMap(buildDirectory, baseUrl, hashes, cssFile)
      const updatedContent = rewriteCssHash(snapshot.get(cssFile)!, pathMap)

      await writeFile(cssFile, updatedContent)
    }),
  )
}

function rewriteCssHash(content: string, pathMap: Record<string, string>) {
  for (const [from, to] of Object.entries(pathMap)) {
    const regex = new RegExp(from)

    content = content.replace(regex, to)
  }

  return content
}
