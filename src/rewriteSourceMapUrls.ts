import { EOL } from 'os'
import { extname } from 'path'
import { SourceFile } from 'ts-morph'

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
  hashes: Map<string, string>,
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
    const ext = extname(filePath)
    const hashedUrl = sourceMapUrl.replace(ext, `.${hash}${ext}`)

    sourceFile.replaceText([...textRange], `//# sourceMappingURL=${hashedUrl}` + EOL)
  }
}
