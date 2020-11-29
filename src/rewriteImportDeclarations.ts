import { dirname } from 'path'
import { SourceFile } from 'ts-morph'

import { makeAbsolute } from './makeAbsolute'
import { replaceHash } from './replaceHash'

export function rewriteImportDeclarations(
  sourceFiles: readonly SourceFile[],
  hashes: Map<string, string>,
) {
  for (const sourceFile of sourceFiles) {
    const directory = dirname(sourceFile.getFilePath())

    for (const importDeclaration of sourceFile.getImportDeclarations()) {
      const specifier = importDeclaration.getModuleSpecifierValue()
      const importFilePath = makeAbsolute(directory, specifier)
      const hash = hashes.get(importFilePath)

      if (hash) {
        importDeclaration.setModuleSpecifier(replaceHash(specifier, hash))
      }
    }
  }
}
