export const journalNoteLimit = 240

export interface DistrictJournalEntry {
  id: string
  note: string
  createdAt: string
  imported?: boolean
}

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
  if (!value || typeof value !== 'object' || !('version' in value) ||
      value.version !== 1 || !('districtId' in value) || value.districtId !== districtId ||
      !('entry' in value) || !value.entry || typeof value.entry !== 'object') return null

  const entry = value.entry
  if (!('id' in entry) || typeof entry.id !== 'string' ||
      !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(entry.id) ||
      !('note' in entry) || typeof entry.note !== 'string' ||
      !entry.note.trim() || entry.note.length > journalNoteLimit ||
      !('createdAt' in entry) || typeof entry.createdAt !== 'string' ||
      !Number.isFinite(Date.parse(entry.createdAt))) return null

  return {
    id: entry.id.toLowerCase(),
    note: entry.note.trim(),
    createdAt: new Date(entry.createdAt).toISOString(),
    imported: true,
  }
}

export function districtJournalPath(districtId: string) {
  return `/night-city/${encodeURIComponent(districtId)}/journal`
}
