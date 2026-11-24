import { randomUUID } from 'node:crypto'
import type { InGameTime, Outing, OutingRun, OutingsData } from '../shared/community.ts'
import { execute, one, rows, type Db } from './db.ts'
import { byToken, importedId, shareToken } from './shares.ts'
import { capability, field, HttpError, inGameTime, list, record, slug, uuid } from './validate.ts'

type ClueRow = {
  id: string
  author: string
  districtId: string
  previous: string | null
  depth: number
  title: string
  prompt: string
  token: string | null
}

const clueColumns = 'id, author_id AS author, district_id AS districtId, previous_clue_id AS previous, depth, title, hint AS prompt, share_token AS token'

async function clueRow(db: Db, id: string) {
  const row = await one<ClueRow>(db, `SELECT ${clueColumns} FROM fan_clues WHERE id = ?`, [id])
  if (!row) throw new HttpError(404, 'This clue is unavailable.')
  return row
}

export async function outingClue(db: Db, id: string): Promise<Outing> {
  const root = await clueRow(db, id)
  const previousStops = []
  let stop = root
  while (stop.previous && previousStops.length < 3) {
    stop = await clueRow(db, stop.previous)
    previousStops.unshift({ id: stop.id, title: stop.title, prompt: stop.prompt })
  }
  return { id, districtId: root.districtId, title: root.title, prompt: root.prompt, token: root.token ?? undefined, previousStops }
}

export async function importClue(db: Db, user: string, input: unknown): Promise<string> {
  const data = record(input)
  const district = slug(data.districtId)
  const trail = list(data.previousStops ?? [], 3).map(record)
  const stops = [...trail, data].map((entry) => {
    const originalId = typeof entry.id === 'string' && entry.id.startsWith('fan-') ? entry.id.slice(4) : entry.id
    return {
      origin: uuid(originalId), title: field(entry.title, 60, 'a clue title'), hint: field(entry.prompt, 240, 'a clue hint'),
    }
  })
  if (new Set(stops.map((stop) => stop.origin)).size !== stops.length) throw new HttpError(400, 'A route repeats a stop.')
  let previous: string | null = null
  let depth = 0
  for (const stop of stops) {
    // Legacy URLs supply an unverified snapshot. They never resolve a real record by ID.
    const id = importedId(user, 'clue', JSON.stringify([district, previous, stop.origin, stop.title, stop.hint]))
    await execute(db, `INSERT INTO fan_clues (id, author_id, district_id, previous_clue_id, depth, title, hint)
      VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id = VALUES(id)`, [id, user, district, previous, ++depth, stop.title, stop.hint])
    previous = id
  }
  if (!previous) throw new HttpError(400, 'Missing clue.')
  return previous
}

export async function userOutings(db: Db, user: string): Promise<OutingsData> {
  const [runs, saved] = await Promise.all([
    rows<{ id: string, templateId: string | null, clueId: string | null, districtId: string | null,
      title: string | null, prompt: string | null, note: string | null, inGameTime: InGameTime | null, completedAt: Date | null }>(db, `
      SELECT r.id, r.template_id AS templateId, r.clue_id AS clueId, t.district_id AS districtId, t.title, t.prompt,
        r.note, r.in_game_time AS inGameTime, r.completed_at AS completedAt
      FROM outing_runs r LEFT JOIN outing_templates t ON t.id = r.template_id
      WHERE r.user_id = ? ORDER BY r.completed_at DESC, r.started_at DESC`, [user]),
    rows<{ id: string }>(db, 'SELECT clue_id AS id FROM saved_fan_clues WHERE user_id = ? ORDER BY saved_at, clue_id', [user]),
  ])
  const clueIds = new Set([...runs.flatMap((run) => run.clueId ? [run.clueId] : []), ...saved.map(({ id }) => id)])
  const clues = new Map<string, Outing>()
  for (const id of clueIds) clues.set(id, await outingClue(db, id))
  const mapped: OutingRun[] = runs.map((run) => {
    const outing = run.clueId ? clues.get(run.clueId) :
      run.templateId && run.districtId && run.title && run.prompt ? { id: run.templateId, districtId: run.districtId, title: run.title, prompt: run.prompt } : null
    if (!outing) throw new Error('An outing run is missing its reference')
    return { id: run.id, outing, note: run.note, inGameTime: run.inGameTime, completedAt: run.completedAt?.toISOString() ?? null }
  })
  return { active: mapped.find(({ completedAt }) => completedAt === null) ?? null, entries: mapped.filter(({ completedAt }) => completedAt !== null),
    savedClues: saved.flatMap(({ id }) => { const clue = clues.get(id); return clue ? [clue] : [] }) }
}

async function accessibleClue(db: Db, user: string, data: Record<string, unknown>) {
  if (data.token !== undefined) return byToken(db, 'clue', capability(data.token))
  if (data.legacy !== undefined) return importClue(db, user, data.legacy)
  const id = uuid(data.clueId)
  if (!await one(db, `SELECT c.id FROM fan_clues c WHERE c.id = ? AND (c.author_id = ? OR EXISTS
    (SELECT 1 FROM saved_fan_clues s WHERE s.clue_id = c.id AND s.user_id = ?))`, [id, user, user])) {
    throw new HttpError(404, 'This clue is unavailable.')
  }
  return id
}

export function saveClue(db: Db, user: string, id: string) {
  return execute(db, `INSERT INTO saved_fan_clues (user_id, clue_id) VALUES (?, ?)
    ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)`, [user, id])
}

export async function outingAction(db: Db, user: string, action: string, data: Record<string, unknown>) {
  switch (action) {
    case 'start-outing': {
      if (await one(db, 'SELECT id FROM outing_runs WHERE active_for = ?', [user])) throw new HttpError(409, 'Finish the active outing first.')
      const template = data.templateId === undefined ? null : slug(data.templateId)
      const clue = template === null ? await accessibleClue(db, user, data) : null
      if (template && await one(db, `SELECT 1 FROM outing_runs WHERE user_id = ? AND template_id = ? AND completed_at IS NOT NULL`, [user, template])) {
        const remaining = await one(db, `SELECT 1 FROM outing_templates t WHERE NOT EXISTS (
          SELECT 1 FROM outing_runs r WHERE r.user_id = ? AND r.template_id = t.id AND r.completed_at IS NOT NULL)`, [user])
        if (remaining) throw new HttpError(409, 'Complete the remaining new outings before repeating one.')
      }
      await execute(db, 'INSERT INTO outing_runs (id, user_id, template_id, clue_id) VALUES (?, ?, ?, ?)', [randomUUID(), user, template, clue])
      if (clue) await execute(db, 'DELETE FROM saved_fan_clues WHERE user_id = ? AND clue_id = ?', [user, clue])
      return {}
    }
    case 'complete-outing': {
      const saved = await execute(db, `UPDATE outing_runs SET note = ?, in_game_time = ?, completed_at = UTC_TIMESTAMP(3)
        WHERE id = ? AND active_for = ?`, [field(data.note, 240, 'a note'), data.time == null ? null : inGameTime(data.time), uuid(data.id), user])
      if (!saved.affectedRows) throw new HttpError(409, 'This outing is no longer active.')
      return {}
    }
    case 'label-outing': {
      const saved = await execute(db, `UPDATE outing_runs SET in_game_time = ? WHERE id = ? AND user_id = ? AND completed_at IS NOT NULL`,
        [data.time == null ? null : inGameTime(data.time), uuid(data.id), user])
      if (!saved.affectedRows) throw new HttpError(404, 'This journal entry is unavailable.')
      return {}
    }
    case 'save-clue': {
      const id = await accessibleClue(db, user, data)
      if (await one(db, 'SELECT id FROM outing_runs WHERE active_for = ? AND clue_id = ?', [user, id])) {
        throw new HttpError(409, 'This clue is your active outing.')
      }
      await saveClue(db, user, id)
      return {}
    }
    case 'remove-clue': {
      await execute(db, 'DELETE FROM saved_fan_clues WHERE user_id = ? AND clue_id = ?', [user, uuid(data.id)])
      return {}
    }
    case 'create-clue': {
      const source = await one<{ district: string, previous: string | null, depth: string | number }>(db, `
        SELECT COALESCE(c.district_id, t.district_id) AS district, r.clue_id AS previous, COALESCE(c.depth, 0) AS depth
        FROM outing_runs r LEFT JOIN outing_templates t ON t.id = r.template_id LEFT JOIN fan_clues c ON c.id = r.clue_id
        WHERE r.id = ? AND r.user_id = ? AND r.completed_at IS NOT NULL`, [uuid(data.runId), user])
      if (!source) throw new HttpError(404, 'Complete your outing before sharing a clue.')
      const depth = Number(source.depth)
      if (depth >= 4) throw new HttpError(409, 'A relay is limited to four stops.')
      const id = randomUUID()
      await execute(db, `INSERT INTO fan_clues (id, author_id, district_id, previous_clue_id, depth, title, hint)
        VALUES (?, ?, ?, ?, ?, ?, ?)`, [id, user, source.district, source.previous, depth + 1,
        field(data.title, 60, 'a clue title'), field(data.hint, 240, 'a clue hint')])
      return { token: await shareToken(db, 'clue', id, user) }
    }
    case 'share-clue':
      return { token: await shareToken(db, 'clue', uuid(data.id), user) }
    default:
      return null
  }
}
