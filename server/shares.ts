import { createHash, randomBytes } from 'node:crypto'
import { execute, one, type Db } from './db.ts'
import { HttpError } from './validate.ts'

const tables = {
  clue: 'fan_clues',
  collection: 'district_collections',
  check: 'finding_checks',
  observation: 'finding_observations',
  argument: 'dilemma_argument_shares',
} as const

export type ShareKind = keyof typeof tables

export async function shareToken(db: Db, kind: ShareKind, id: string, user: string) {
  const table = tables[kind]
  const row = await one<{ token: string | null }>(db, `SELECT share_token AS token FROM ${table} WHERE id = ? AND author_id = ? FOR UPDATE`, [id, user])
  if (!row) throw new HttpError(404, 'This item is unavailable.')
  if (row.token) return row.token
  const token = randomBytes(32).toString('base64url')
  await execute(db, `UPDATE ${table} SET share_token = ? WHERE id = ? AND author_id = ?`, [token, id, user])
  return token
}

export async function byToken(db: Db, kind: ShareKind, token: string) {
  const row = await one<{ id: string }>(db, `SELECT id FROM ${tables[kind]} WHERE share_token = ?`, [token])
  if (!row) throw new HttpError(404, 'This share link is unavailable.')
  return row.id
}

export function importedId(user: string, kind: string, origin: string) {
  const hex = createHash('sha256').update(JSON.stringify([user, kind, origin])).digest('hex')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-8${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`
}
