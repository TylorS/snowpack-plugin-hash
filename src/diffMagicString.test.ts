import { describe, given, it } from '@typed/test'

import { diffMagicString } from './diffMagicString'

export const test = describe(`diffMagicString`, [
  given(`File name, before content, after content`, [
    it(`generate MagicString with changes`, ({ equal }) => {
      const fileName = 'testFile.ts'
      const beforeContent = `const foo: string = 'example'`
      const afterContent = `const bar = 'whatever' as const`
      const [magicString] = diffMagicString(fileName, beforeContent, afterContent)

      equal(beforeContent, magicString.original)
      equal(afterContent, magicString.toString())
    }),
  ]),
])
