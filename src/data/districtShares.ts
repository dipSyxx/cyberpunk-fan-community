import type { Collection, FindingObservation, FindingRequest, FindingResult, SharedFinding } from '../../shared/community'
import { readJournalEntry, type DistrictJournalEntry } from './districtJournal'
import { readInGameTime } from './outings'
import { readShareId, readShareJson, readShareObject, readShareText, shareParams, shareTitleLimit } from './shareLinks'

export const findingPlaceLimit = 120
export const districtCollectionLimit = 3

export const findingResults = {
  confirmed: 'Saw the same thing',
  different: 'Found something different',
  notFound: 'Could not find it',
}

export function readFindingResult(value: unknown): FindingResult | null {
  return value === 'confirmed' || value === 'different' || value === 'notFound' ? value : null
}

function readFindingRequest(value: unknown): FindingRequest | null {
  const request = readShareObject(value)
  const id = readShareId(request?.id)
  const note = readShareText(request?.note)
  const place = readShareText(request?.place, findingPlaceLimit)
  const time = readInGameTime(request?.time)
  return id && note && place && time ? { id, note, place, time } : null
}

function readFindingReport(value: unknown): FindingObservation | null {
  const report = readShareObject(value)
  const entry = readJournalEntry(value)
  const result = readFindingResult(report?.result)
  const time = readInGameTime(report?.time)
  return entry && result && time ? { ...entry, sourceId: entry.id, result, time } : null
}

function readDistrictShare(hash: string, parameter: string, districtId: string) {
  const value = readShareObject(readShareJson(shareParams(hash).get(parameter)))
  return value?.version === 1 && value.districtId === districtId ? readShareObject(value.payload) : null
}

export function readSharedFinding(hash: string, districtId: string): SharedFinding | null {
  const value = readDistrictShare(hash, 'finding', districtId)
  const request = readFindingRequest(value?.request)
  if (!request) return null
  if (value?.report === undefined) return { districtId, request }

  const report = readFindingReport(value.report)
  return report ? { districtId, request, report } : null
}

export function readSharedCollection(hash: string, districtId: string): Collection | null {
  const value = readDistrictShare(hash, 'collection', districtId)
  const id = readShareId(value?.id)
  const title = readShareText(value?.title, shareTitleLimit)
  if (!id || !title || !Array.isArray(value?.entries) || value.entries.length < 2 || value.entries.length > districtCollectionLimit) return null

  const entries: DistrictJournalEntry[] = []
  const ids = new Set<string>()
  for (const item of value.entries) {
    const entry = readJournalEntry(item)
    if (!entry || ids.has(entry.id)) return null
    ids.add(entry.id)
    entries.push(entry)
  }
  return { id, title, entries }
}
