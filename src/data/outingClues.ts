import { districts } from './districts'
import type { Outing, OutingStop } from './outings'
import { makeShareLink, readShareId, readShareJson, readShareObject, readShareText, shareParams, shareTextLimit, shareTitleLimit } from './shareLinks'

export const clueTitleLimit = shareTitleLimit
export const clueHintLimit = shareTextLimit
export const relayStopLimit = 4

function readStop(id: unknown, title: unknown, prompt: unknown): OutingStop | null {
  const clueId = typeof id === 'string' && id.startsWith('fan-') ? readShareId(id.slice(4)) : null
  const clueTitle = readShareText(title, clueTitleLimit)
  const cluePrompt = readShareText(prompt, clueHintLimit)
  return clueId && clueTitle && cluePrompt ? { id: `fan-${clueId}`, title: clueTitle, prompt: cluePrompt } : null
}

export function readOutingClue(hash: string): Outing | null {
  const params = shareParams(hash)
  const stop = readStop(params.get('clue'), params.get('title'), params.get('hint'))
  const districtId = params.get('district')
  if (!stop || !districtId || !districts.some((district) => district.id === districtId)) return null
  if (!params.has('trail')) return { ...stop, districtId }

  const trail = readShareJson(params.get('trail'))
  if (!Array.isArray(trail) || trail.length < 1 || trail.length >= relayStopLimit) return null

  const previousStops: OutingStop[] = []
  const ids = new Set([stop.id])
  for (const value of trail) {
    const item = readShareObject(value)
    const previous = item && readStop(item.id, item.title, item.prompt)
    if (!previous || ids.has(previous.id)) return null
    ids.add(previous.id)
    previousStops.push(previous)
  }

  return { ...stop, districtId, previousStops }
}

export function shareOutingClue({ id, districtId, title, prompt, previousStops }: Outing) {
  const params = new URLSearchParams({
    clue: id,
    district: districtId,
    title,
    hint: prompt,
  })
  if (previousStops?.length) params.set('trail', JSON.stringify(previousStops))
  return makeShareLink('/', params)
}

export function makeOutingClueLink(districtId: string, title: string, hint: string, previousStops: OutingStop[]) {
  return shareOutingClue({ id: `fan-${crypto.randomUUID()}`, districtId, title, prompt: hint, previousStops })
}
