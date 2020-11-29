import { SourceFile } from 'ts-morph'

import { rewriteCssHashes } from './rewriteCssHashes'
import { rewriteExportDeclarations } from './rewriteExportDeclarations'
import { rewriteImportDeclarations } from './rewriteImportDeclarations'
import { rewriteSourceMapUrls } from './rewriteSourceMapUrls'

export type RewriteHashesOptions = {
  readonly prefix: string
  readonly buildDirectory: string
  readonly jsFiles: readonly SourceFile[]
  readonly cssFiles: readonly string[]
  readonly hashes: ReadonlyMap<string, string>
  readonly initialSnapshot: ReadonlyMap<string, string>
}

export async function rewriteHashesInSourceFiles(options: RewriteHashesOptions) {
  const { prefix, buildDirectory, jsFiles, cssFiles, hashes, initialSnapshot } = options

  // Update JavaScript Files with hashes
  if (jsFiles.length > 0) {
    console.info(prefix, 'Rewriting JavaScript files...')

    rewriteImportDeclarations(jsFiles, hashes)
    rewriteExportDeclarations(jsFiles, hashes)
    rewriteSourceMapUrls(jsFiles, hashes)

    await Promise.all(jsFiles.map((s) => s.save()))
  }

  // Update CSS Files with hashes
  if (cssFiles.length > 0) {
    console.info(prefix, 'Rewriting CSS files...')

    await rewriteCssHashes(buildDirectory, cssFiles, initialSnapshot, hashes)
  }
}
