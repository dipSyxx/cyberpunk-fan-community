import { districts } from './districts'
import type { Outing } from './outings'

export const clueTitleLimit = 60
export const clueHintLimit = 240

export function readOutingClue(hash: string): Outing | null {
  const params = new URLSearchParams(hash.slice(1))
  const id = params.get('clue')
  const districtId = params.get('district')
  const title = params.get('title')?.trim()
  const prompt = params.get('hint')?.trim()

  if (!id || !/^fan-[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/.test(id) ||
      !districtId || !districts.some((district) => district.id === districtId) ||
      !title || title.length > clueTitleLimit || !prompt || prompt.length > clueHintLimit) {
    return null
  }

  return { id, districtId, title, prompt }
}

export function makeOutingClueLink(districtId: string, title: string, hint: string) {
  const params = new URLSearchParams({
    clue: `fan-${crypto.randomUUID()}`,
    district: districtId,
    title,
    hint,
  })
  const url = new URL('/', window.location.origin)
  url.hash = params.toString()
  return url.href
}
