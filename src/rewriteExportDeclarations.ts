import { dirname } from 'path'
import { SourceFile } from 'ts-morph'

import { makeAbsolute } from './makeAbsolute'
import { replaceHash } from './replaceHash'

export function rewriteExportDeclarations(
  sourceFiles: readonly SourceFile[],
  hashes: Map<string, string>,
) {
  for (const sourceFile of sourceFiles) {
    const directory = dirname(sourceFile.getFilePath())

    for (const exportDeclaration of sourceFile.getExportDeclarations()) {
      const specifier = exportDeclaration.getModuleSpecifierValue()

      if (!specifier) {
        continue
      }

      const importFilePath = makeAbsolute(directory, specifier)
      const hash = hashes.get(importFilePath)

      if (hash) {
        exportDeclaration.setModuleSpecifier(replaceHash(specifier, hash))
      }
    }
  }
}
