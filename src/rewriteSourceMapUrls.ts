import { EOL } from 'os'
import { basename } from 'path'
import { SourceFile } from 'ts-morph'

import { replaceHash } from './replaceHash'

const innerRegex = /[#@] sourceMappingURL=([^\s'"]*)/
const regex = RegExp(
  '(?:' +
    '/\\*' +
    '(?:\\s*\r?\n(?://)?)?' +
    '(?:' +
    innerRegex.source +
    ')' +
    '\\s*' +
    '\\*/' +
    '|' +
    '//(?:' +
    innerRegex.source +
    ')' +
    ')' +
    '\\s*',
)

function getSourceMapUrl(code: string) {
  const match = code.match(regex)

  return match ? match[1] || match[2] || '' : null
}

function getSourceMapTextRange(code: string) {
  const match = code.match(regex)

  if (!match || !match.length || !match.index) {
    return null
  }

  const start = match.index

  return [start, start + match[0].length] as const
}

export function rewriteSourceMapUrls(
  sourceFiles: readonly SourceFile[],
  hashes: ReadonlyMap<string, string>,
) {
  for (const sourceFile of sourceFiles) {
    const contents = sourceFile.getFullText()
    const sourceMapUrl = getSourceMapUrl(contents)
    const textRange = getSourceMapTextRange(contents)

    if (!sourceMapUrl || !textRange) {
      continue
    }

    const filePath = sourceFile.getFilePath()
    const hash = hashes.get(filePath)!
    const hashedUrl = basename(replaceHash(filePath, hash))

    sourceFile.replaceText([...textRange], `//# sourceMappingURL=${hashedUrl}` + EOL)
  }
}
