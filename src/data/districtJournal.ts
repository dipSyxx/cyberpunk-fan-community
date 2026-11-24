import { readShareId, readShareObject, readShareText, shareTextLimit } from './shareLinks'
import type { JournalEntry } from '../../shared/community'

export const journalNoteLimit = shareTextLimit

export type DistrictJournalEntry = JournalEntry

interface DistrictJournalFile {
  version: 1
  districtId: string
  entry: DistrictJournalEntry
}

export function exportDistrictEntry(districtId: string, { id, note, createdAt }: DistrictJournalEntry) {
  const file: DistrictJournalFile = { version: 1, districtId, entry: { id, note, createdAt } }
  return new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' })
}

export function readDistrictEntry(value: unknown, districtId: string): DistrictJournalEntry | null {
  const file = readShareObject(value)
  const entry = file?.version === 1 && file.districtId === districtId ? readJournalEntry(file.entry) : null
  return entry ? { ...entry, imported: true } : null
}

export function readJournalEntry(value: unknown): DistrictJournalEntry | null {
  const entry = readShareObject(value)
  const id = readShareId(entry?.id)
  const note = readShareText(entry?.note)
  const date = typeof entry?.createdAt === 'string' ? Date.parse(entry.createdAt) : NaN
  return id && note && Number.isFinite(date) ? { id, note, createdAt: new Date(date).toISOString() } : null
}

export function districtJournalPath(districtId: string) {
  return `/night-city/${encodeURIComponent(districtId)}/journal`
}
