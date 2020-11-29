import { SourceFile } from 'ts-morph'
import { yellow } from 'typed-colors'

import { rewriteCssHashes } from './rewriteCssHashes'
import { rewriteExportDeclarations } from './rewriteExportDeclarations'
import { rewriteImportDeclarations } from './rewriteImportDeclarations'
import { rewriteSourceMapUrls } from './rewriteSourceMapUrls'

export type RewriteHashesOptions = {
  readonly log: (msg: string) => void
  readonly buildDirectory: string
  readonly jsFiles: readonly SourceFile[]
  readonly cssFiles: readonly string[]
  readonly hashes: ReadonlyMap<string, string>
  readonly initialSnapshot: ReadonlyMap<string, string>
}

export async function rewriteHashesInSourceFiles(options: RewriteHashesOptions) {
  const { log, buildDirectory, jsFiles, cssFiles, hashes, initialSnapshot } = options

  // Update JavaScript Files with hashes
  if (jsFiles.length > 0) {
    log(`${yellow('!')} Rewriting JavaScript files...`)

    rewriteImportDeclarations(jsFiles, hashes)
    rewriteExportDeclarations(jsFiles, hashes)
    rewriteSourceMapUrls(jsFiles, hashes)

    await Promise.all(jsFiles.map((s) => s.save()))
  }

  // Update CSS Files with hashes
  if (cssFiles.length > 0) {
    log(`${yellow('!')} Rewriting CSS files...`)

    await rewriteCssHashes(buildDirectory, cssFiles, initialSnapshot, hashes)
  }
}
