import { createHash } from 'crypto'

export function generateHash(contents: string, hashLength: number): string {
  return createHash('sha256').update(contents).digest('hex').substring(0, hashLength)
}
