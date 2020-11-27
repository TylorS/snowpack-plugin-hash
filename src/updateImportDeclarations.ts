import { dirname, extname } from 'path'
import { SourceFile } from 'ts-morph'

import { makeAbsolute } from './makeAbsolute'

export function updateImportDeclarations(
  sourceFiles: readonly SourceFile[],
  hashes: Map<string, string>,
) {
  for (const sourceFile of sourceFiles) {
    const directory = dirname(sourceFile.getFilePath())

    for (const importDeclaration of sourceFile.getImportDeclarations()) {
      const specifier = importDeclaration.getModuleSpecifierValue()
      const importFilePath = makeAbsolute(directory, specifier)
      const hash = hashes.get(importFilePath)
      const ext = extname(specifier)

      if (hash) {
        importDeclaration.setModuleSpecifier(specifier.replace(ext, `.${hash}${ext}`))
      }
    }
  }
}
