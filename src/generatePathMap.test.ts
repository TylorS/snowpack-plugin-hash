import { describe, given, it } from '@typed/test'

import { generatePathMap } from './generatePathMap'

export const test = describe(`generatePathMap`, [
  given(`Build Directory, Hashes, and path to HTML file`, [
    it(`returns Record<string, string> of all expected paths`, ({ equal }) => {
      const buildDirectory = '/test'
      const hashes = new Map([
        ['/test/A/a.js', 'asdf'],
        ['/test/A/b.js', 'fdaf'],
        ['/test/B/a.js', 'ifod'],
        ['/test/C/d/a.js', 'eldi'],
      ])
      const absoluteExpected = {
        '/A/a.js': '/A/a.asdf.js',
        '/A/b.js': '/A/b.fdaf.js',
        '/B/a.js': '/B/a.ifod.js',
        '/C/d/a.js': '/C/d/a.eldi.js',
      }
      const htmlFileA = '/test/index.html'
      const expectedA = {
        ...absoluteExpected,
        './A/a.js': './A/a.asdf.js',
        './A/b.js': './A/b.fdaf.js',
        './B/a.js': './B/a.ifod.js',
        './C/d/a.js': './C/d/a.eldi.js',
      }
      const htmlFileB = '/test/B/b.index.html'
      const expectedB = {
        ...absoluteExpected,
        '../A/a.js': '../A/a.asdf.js',
        '../A/b.js': '../A/b.fdaf.js',
        './a.js': './a.ifod.js',
        '../C/d/a.js': '../C/d/a.eldi.js',
      }

      equal(expectedA, generatePathMap(buildDirectory, '/', hashes, htmlFileA))
      equal(expectedB, generatePathMap(buildDirectory, '/', hashes, htmlFileB))
    }),
  ]),
])
