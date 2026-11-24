import { randomUUID } from 'node:crypto'
import type { Collection, DistrictJournal, FindingCheck, FindingObservation, FindingRequest, FindingResult, InGameTime, JournalEntry, SharedFinding } from '../shared/community.ts'
import { execute, one, rows, type Db } from './db.ts'
import { byToken, importedId, shareToken } from './shares.ts'
import { capability, date, field, HttpError, inGameTime, list, record, result, slug, uuid } from './validate.ts'

type EntryRow = { id: string, note: string, createdAt: Date, imported?: number }
type CollectionRow = { id: string, districtId: string, title: string, token: string | null }
type CheckRow = { id: string, districtId: string, note: string, place: string, time: InGameTime, token: string | null }
type ObservationRow = { id: string, checkId: string, sourceId: string, note: string, createdAt: Date, time: InGameTime, result: FindingResult, token: string | null }

const collectionColumns = 'c.id, c.district_id AS districtId, c.title, c.share_token AS token'
const checkColumns = 'c.id, c.district_id AS districtId, c.note, c.place, c.in_game_time AS time, c.share_token AS token'
const observationColumns = 'o.id, o.check_id AS checkId, o.source_id AS sourceId, o.note, o.created_at AS createdAt, o.in_game_time AS time, o.result, o.share_token AS token'

function entry(row: EntryRow): JournalEntry {
  return { id: row.id, note: row.note, createdAt: row.createdAt.toISOString(), imported: Boolean(row.imported) }
}

function request(row: CheckRow): FindingRequest {
  return { id: row.id, note: row.note, place: row.place, time: row.time, token: row.token ?? undefined }
}

function observation(row: ObservationRow): FindingObservation {
  return { ...entry(row), sourceId: row.sourceId, time: row.time, result: row.result, token: row.token ?? undefined }
}

async function collection(db: Db, row: CollectionRow): Promise<Collection> {
  const items = await rows<EntryRow>(db, `SELECT source_id AS id, note, note_created_at AS createdAt
    FROM district_collection_items WHERE collection_id = ? ORDER BY position`, [row.id])
  return { id: row.id, title: row.title, token: row.token ?? undefined, entries: items.map(entry) }
}

async function getCollection(db: Db, id: string, user: string | null): Promise<CollectionRow> {
  const item = await one<CollectionRow>(db, `SELECT ${collectionColumns} FROM district_collections c WHERE c.id = ?
    AND (? IS NULL OR c.author_id = ? OR EXISTS (
      SELECT 1 FROM saved_district_collections s WHERE s.collection_id = c.id AND s.user_id = ?
    ))`, [id, user, user, user])
  if (!item) throw new HttpError(404, 'This collection is unavailable.')
  return item
}

async function getCheck(db: Db, id: string, user: string | null) {
  const row = await one<CheckRow>(db, `SELECT ${checkColumns} FROM finding_checks c WHERE c.id = ?
    AND (? IS NULL OR c.author_id = ? OR EXISTS (
      SELECT 1 FROM saved_finding_checks s WHERE s.check_id = c.id AND s.user_id = ?
    ))`, [id, user, user, user])
  if (!row) throw new HttpError(404, 'This finding check is unavailable.')
  return row
}

async function getObservation(db: Db, id: string, user: string | null) {
  const row = await one<ObservationRow>(db, `SELECT ${observationColumns} FROM finding_observations o WHERE o.id = ?
    AND (? IS NULL OR o.author_id = ? OR EXISTS (
      SELECT 1 FROM saved_finding_observations s WHERE s.observation_id = o.id AND s.user_id = ?
    ))`, [id, user, user, user])
  if (!row) throw new HttpError(404, 'This observation is unavailable.')
  return row
}

export async function journalData(db: Db, user: string, district: string): Promise<DistrictJournal> {
  const [entries, collections, checks, reports] = await Promise.all([
    rows<EntryRow>(db, `SELECT source_id AS id, note, imported, created_at AS createdAt FROM district_journal_entries
      WHERE user_id = ? AND district_id = ? ORDER BY created_at DESC, id`, [user, district]),
    rows<CollectionRow>(db, `SELECT ${collectionColumns} FROM district_collections c WHERE c.district_id = ? AND
      (c.author_id = ? OR EXISTS (SELECT 1 FROM saved_district_collections s WHERE s.collection_id = c.id AND s.user_id = ?))
      ORDER BY c.created_at DESC, c.id`, [district, user, user]),
    rows<CheckRow>(db, `SELECT ${checkColumns} FROM finding_checks c WHERE c.district_id = ? AND
      (c.author_id = ? OR EXISTS (SELECT 1 FROM saved_finding_checks s WHERE s.check_id = c.id AND s.user_id = ?))
      ORDER BY c.created_at DESC, c.id`, [district, user, user]),
    rows<ObservationRow>(db, `SELECT ${observationColumns} FROM finding_observations o JOIN finding_checks c ON c.id = o.check_id
      WHERE c.district_id = ? AND (o.author_id = ? OR EXISTS (
        SELECT 1 FROM saved_finding_observations s WHERE s.observation_id = o.id AND s.user_id = ?
      )) ORDER BY o.created_at DESC, o.id`, [district, user, user]),
  ])
  const mapped: FindingCheck[] = checks.map((item) => ({ request: request(item), reports: [] }))
  const byId = new Map(mapped.map((item) => [item.request.id, item.reports]))
  for (const report of reports) byId.get(report.checkId)?.push(observation(report))
  return { entries: entries.map(entry), collections: await Promise.all(collections.map((item) => collection(db, item))), checks: mapped }
}

export function checkedEntry(value: unknown) {
  const item = record(value)
  return { id: uuid(item.id), note: field(item.note, 240, 'a note'), createdAt: date(item.createdAt) }
}

export async function saveEntry(db: Db, user: string, district: string, item: EntryRow, imported: boolean) {
  return execute(db, `INSERT INTO district_journal_entries (id, user_id, district_id, source_id, note, imported, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id = VALUES(id)`,
  [importedId(user, 'entry', `${district}:${item.id}`), user, district, item.id, item.note, imported, item.createdAt])
}

async function createCollection(db: Db, user: string, district: string, title: string, entries: EntryRow[], id: string = randomUUID()) {
  if (entries.length < 2 || entries.length > 3 || new Set(entries.map((item) => item.id)).size !== entries.length) {
    throw new HttpError(400, 'Choose two or three different notes.')
  }
  if (await one(db, 'SELECT id FROM district_collections WHERE id = ? AND author_id = ?', [id, user])) return id
  await execute(db, 'INSERT INTO district_collections (id, author_id, district_id, title) VALUES (?, ?, ?, ?)', [id, user, district, title])
  for (const [index, item] of entries.entries()) {
    await execute(db, `INSERT INTO district_collection_items (collection_id, position, source_id, note, note_created_at)
      VALUES (?, ?, ?, ?, ?)`, [id, index + 1, item.id, item.note, item.createdAt])
  }
  return id
}

export function importCollection(db: Db, user: string, district: string, value: unknown) {
  const data = record(value)
  return createCollection(db, user, district, field(data.title, 60, 'a title'), list(data.entries, 3).map(checkedEntry),
    importedId(user, 'collection', `${district}:${uuid(data.id)}`))
}

async function saveCheck(db: Db, user: string, id: string) {
  await execute(db, `INSERT INTO saved_finding_checks (user_id, check_id) VALUES (?, ?)
    ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)`, [user, id])
}

async function createCheck(db: Db, user: string, district: string, note: string, place: unknown, time: unknown, id: string = randomUUID()) {
  await execute(db, `INSERT INTO finding_checks (id, author_id, district_id, note, place, in_game_time)
    VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id = VALUES(id)`,
  [id, user, district, note, field(place, 120, 'a location'), inGameTime(time)])
  return id
}

async function createObservation(db: Db, user: string, checkId: string, note: string, time: unknown, outcome: unknown,
  id: string = randomUUID(), sourceId = id, createdAt = new Date()) {
  await execute(db, `INSERT INTO finding_observations (id, author_id, check_id, source_id, note, in_game_time, result, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id = VALUES(id)`,
  [id, user, checkId, sourceId, note, inGameTime(time), result(outcome), createdAt])
  return id
}

export async function importFinding(db: Db, user: string, district: string, input: unknown, reports: unknown[]) {
  const item = record(input)
  const checkId = importedId(user, 'check', `${district}:${uuid(item.id)}`)
  const note = field(item.note, 240, 'a note')
  const place = field(item.place, 120, 'a location')
  const time = inGameTime(item.time)
  const existing = await one<CheckRow>(db, `SELECT ${checkColumns} FROM finding_checks c WHERE c.id = ? AND c.author_id = ?`, [checkId, user])
  if (existing && (existing.note !== note || existing.place !== place || existing.time !== time)) {
    throw new HttpError(409, 'This link differs from the finding check already saved.')
  }
  if (!existing) await createCheck(db, user, district, note, place, time, checkId)
  for (const input of reports) {
    const item = record(input)
    const inputEntry = checkedEntry(item)
    await createObservation(db, user, checkId, inputEntry.note, item.time, item.result,
      importedId(user, 'observation', `${checkId}:${inputEntry.id}`), inputEntry.id, inputEntry.createdAt)
  }
}

export async function sharedCollection(db: Db, token: string) {
  const item = await getCollection(db, await byToken(db, 'collection', token), null)
  return { districtId: item.districtId, collection: await collection(db, item) }
}

export async function sharedFinding(db: Db, kind: 'check' | 'observation', token: string): Promise<SharedFinding> {
  const id = await byToken(db, kind, token)
  const report = kind === 'observation' ? await getObservation(db, id, null) : undefined
  const check = await getCheck(db, report?.checkId ?? id, null)
  return { districtId: check.districtId, request: request(check), report: report ? observation(report) : undefined }
}

export async function journalAction(db: Db, user: string, action: string, data: Record<string, unknown>) {
  switch (action) {
    case 'journal-note': {
      await saveEntry(db, user, slug(data.districtId), { id: randomUUID(), note: field(data.note, 240, 'a note'), createdAt: new Date() }, false)
      return {}
    }
    case 'import-note': {
      const district = slug(data.districtId)
      const note = checkedEntry(data.entry)
      const exists = await one(db, 'SELECT id FROM district_journal_entries WHERE user_id = ? AND district_id = ? AND source_id = ?',
        [user, district, note.id])
      if (exists) throw new HttpError(409, 'This note is already in your district journal.')
      await saveEntry(db, user, district, note, true)
      return {}
    }
    case 'create-collection': {
      const district = slug(data.districtId)
      const ids = list(data.entries, 3).map(uuid)
      const entries = []
      for (const id of ids) {
        const note = await one<EntryRow>(db, `SELECT source_id AS id, note, created_at AS createdAt FROM district_journal_entries
          WHERE user_id = ? AND district_id = ? AND source_id = ?`, [user, district, id])
        if (!note) throw new HttpError(404, 'This district note is unavailable.')
        entries.push(note)
      }
      return { id: await createCollection(db, user, district, field(data.title, 60, 'a title'), entries) }
    }
    case 'save-collection': {
      if (data.legacy !== undefined) {
        await importCollection(db, user, slug(data.districtId), data.legacy)
        return {}
      }
      const id = await byToken(db, 'collection', capability(data.token))
      const item = await getCollection(db, id, null)
      if (item.districtId !== slug(data.districtId)) throw new HttpError(404, 'This collection belongs to another district.')
      await execute(db, `INSERT INTO saved_district_collections (user_id, collection_id) VALUES (?, ?)
        ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)`, [user, id])
      return {}
    }
    case 'copy-collection': {
      const item = await getCollection(db, uuid(data.id), user)
      const entries = await rows<EntryRow>(db, `SELECT source_id AS id, note, note_created_at AS createdAt
        FROM district_collection_items WHERE collection_id = ? ORDER BY position`, [item.id])
      for (const note of entries) await saveEntry(db, user, item.districtId, note, true)
      return {}
    }
    case 'create-finding': {
      const district = slug(data.districtId)
      const note = await one<{ note: string }>(db, `SELECT note FROM district_journal_entries WHERE
        user_id = ? AND district_id = ? AND source_id = ?`, [user, district, uuid(data.entryId)])
      if (!note) throw new HttpError(404, 'This district note is unavailable.')
      return { id: await createCheck(db, user, district, note.note, data.place, data.time) }
    }
    case 'add-observation': {
      const check = await getCheck(db, uuid(data.checkId), user)
      return { id: await createObservation(db, user, check.id, field(data.note, 240, 'a note'), data.time, data.result) }
    }
    case 'save-finding': {
      if (data.legacy !== undefined) {
        const legacy = record(data.legacy)
        await importFinding(db, user, slug(data.districtId), legacy.request, legacy.report === undefined ? [] : [legacy.report])
        return {}
      }
      const kind = data.kind
      if (kind !== 'check' && kind !== 'observation') throw new HttpError(400, 'Invalid finding link.')
      const shared = await sharedFinding(db, kind, capability(data.token))
      if (shared.districtId !== slug(data.districtId)) throw new HttpError(404, 'This finding belongs to another district.')
      await saveCheck(db, user, shared.request.id)
      if (shared.report) await execute(db, `INSERT INTO saved_finding_observations (user_id, observation_id)
        VALUES (?, ?) ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)`, [user, shared.report.id])
      return {}
    }
    case 'copy-observation': {
      const report = await getObservation(db, uuid(data.id), user)
      const check = await getCheck(db, report.checkId, user)
      await saveEntry(db, user, check.districtId, { ...report, id: report.sourceId }, true)
      return {}
    }
    case 'share-collection':
      return { token: await shareToken(db, 'collection', uuid(data.id), user) }
    case 'share-check':
      return { token: await shareToken(db, 'check', uuid(data.id), user) }
    case 'share-observation':
      return { token: await shareToken(db, 'observation', uuid(data.id), user) }
    default:
      return null
  }
}
