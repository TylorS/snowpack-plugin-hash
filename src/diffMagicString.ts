import remapping from '@ampproject/remapping'
import { Change, diffChars } from 'diff'
import MagicString from 'magic-string'

export type MagicStringStep = readonly [ms: MagicString, map: string | null, index: number]

export function diffMagicString(
  filename: string,
  beforeContent: string,
  afterContent: string,
): readonly [ms: MagicString, map: string] {
  const changes = diffChars(beforeContent, afterContent)
  const applyChange = applyDiffChange(filename)
  const ms = new MagicString(beforeContent, {
    filename,
    indentExclusionRanges: [],
  })

  let step: MagicStringStep = [ms, null, 0]
  for (const change of changes) {
    step = applyChange(step, change)
  }

  // Reset the original
  step[0].original = ms.original

  return [step[0], step[1]!] as const
}

function applyDiffChange(file: string) {
  return (step: MagicStringStep, change: Change): MagicStringStep => {
    if (change.added === true) {
      return applyChangeAdded(file, step, change)
    }

    if (change.removed === true) {
      return applyChangeRemoved(file, step, change)
    }

    const count = change.count || change.value.length

    return [step[0], step[1], step[2] + count]
  }
}

function applyChangeAdded(
  file: string,
  [ms, beforeMap, index]: MagicStringStep,
  change: Change,
): MagicStringStep {
  const count = change.count || change.value.length

  ms = ms.appendRight(index, change.value)

  const nextMap = ms
    .generateMap({
      hires: true,
      file,
      source: ms.original,
      includeContent: true,
    })
    .toString()

  const remapped = beforeMap
    ? remapping([beforeMap, nextMap], () => null, false).toString()
    : nextMap
  const next = new MagicString(ms.toString(), { filename: file, indentExclusionRanges: [] })

  return [next, remapped, index + count]
}

function applyChangeRemoved(
  file: string,
  [ms, beforeMap, index]: MagicStringStep,
  change: Change,
): MagicStringStep {
  const count = change.count ? change.count : change.value.length

  ms = ms.remove(index, index + count)

  const nextMap = ms
    .generateMap({
      hires: true,
      file,
      source: ms.original,
      includeContent: true,
    })
    .toString()
  const remapped = beforeMap
    ? remapping([beforeMap, nextMap], () => null, false).toString()
    : nextMap
  const next = new MagicString(ms.toString(), { filename: file, indentExclusionRanges: [] })

  return [next, remapped, index]
}
