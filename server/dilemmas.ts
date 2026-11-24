import { randomUUID } from 'node:crypto'
import type { Argument, DilemmaJournal } from '../shared/community.ts'
import { execute, one, rows, type Db } from './db.ts'
import { byToken, importedId, shareToken } from './shares.ts'
import { boolean, capability, field, HttpError, record, slug, uuid } from './validate.ts'

function argument(row: Argument): Argument {
  return { ...row, spoiler: Boolean(row.spoiler), token: row.token ?? undefined }
}

async function ownResponse(db: Db, user: string, character: string) {
  return one<Argument>(db, `SELECT revision_id AS id, dilemma_id AS characterId, body AS text, spoiler
    FROM dilemma_responses WHERE user_id = ? AND dilemma_id = ?`, [user, character])
}

async function requireResponse(db: Db, user: string | null, character: string) {
  if (!user || !await ownResponse(db, user, character)) throw new HttpError(403, 'Save your own response to open this argument.')
}

export async function dilemmaData(db: Db, user: string, character: string): Promise<DilemmaJournal> {
  const own = await ownResponse(db, user, character)
  if (!own) return { own: null, received: [] }
  const shared = await one<{ token: string | null }>(db, 'SELECT share_token AS token FROM dilemma_argument_shares WHERE id = ?', [own.id])
  const received = await rows<Argument>(db, `SELECT a.id, a.dilemma_id AS characterId, a.body AS text, a.spoiler, a.share_token AS token
    FROM saved_dilemma_arguments s JOIN dilemma_argument_shares a ON a.id = s.argument_id
    WHERE s.user_id = ? AND a.dilemma_id = ? ORDER BY s.saved_at DESC, a.id`, [user, character])
  return { own: argument({ ...own, token: shared?.token ?? undefined }), received: received.map(argument) }
}

export async function sharedArgument(db: Db, user: string | null, token: string) {
  const id = await byToken(db, 'argument', token)
  const shared = await one<Argument>(db, `SELECT id, dilemma_id AS characterId, body AS text, spoiler, share_token AS token
    FROM dilemma_argument_shares WHERE id = ?`, [id])
  if (!shared) throw new HttpError(404, 'This argument is unavailable.')
  await requireResponse(db, user, shared.characterId)
  return argument(shared)
}

export async function saveResponse(db: Db, user: string, character: string, text: string, spoiler: boolean, preserve = false) {
  const own = await ownResponse(db, user, character)
  if (own && (preserve || (own.text === text && Boolean(own.spoiler) === spoiler))) return
  await execute(db, `INSERT INTO dilemma_responses (user_id, dilemma_id, body, spoiler, revision_id) VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE body = VALUES(body), spoiler = VALUES(spoiler), revision_id = VALUES(revision_id)`,
  [user, character, text, spoiler, randomUUID()])
}

async function keepArgument(db: Db, user: string, id: string) {
  await execute(db, `INSERT INTO saved_dilemma_arguments (user_id, argument_id) VALUES (?, ?)
    ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)`, [user, id])
}

export async function importArgument(db: Db, user: string, character: string, value: unknown) {
  const data = record(value)
  await requireResponse(db, user, character)
  const id = importedId(user, 'argument', `${character}:${uuid(data.id)}`)
  await execute(db, `INSERT INTO dilemma_argument_shares (id, author_id, dilemma_id, body, spoiler)
    VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id = VALUES(id)`,
  [id, user, character, field(data.text, 240, 'an argument'), boolean(data.spoiler)])
  await keepArgument(db, user, id)
}

export async function dilemmaAction(db: Db, user: string, action: string, data: Record<string, unknown>) {
  switch (action) {
    case 'dilemma-response':
      await saveResponse(db, user, slug(data.characterId), field(data.text, 240, 'a response'), boolean(data.spoiler))
      return {}
    case 'share-argument': {
      const character = slug(data.characterId)
      const own = await ownResponse(db, user, character)
      if (!own) throw new HttpError(404, 'Save your response before sharing.')
      await execute(db, `INSERT INTO dilemma_argument_shares (id, author_id, dilemma_id, body, spoiler) VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE id = VALUES(id)`, [own.id, user, character, own.text, Boolean(own.spoiler)])
      return { token: await shareToken(db, 'argument', own.id, user) }
    }
    case 'save-argument': {
      const character = slug(data.characterId)
      if (data.legacy !== undefined) {
        await importArgument(db, user, character, data.legacy)
        return {}
      }
      const shared = await sharedArgument(db, user, capability(data.token))
      if (shared.characterId !== character) throw new HttpError(404, 'This argument belongs to another dilemma.')
      const own = await ownResponse(db, user, character)
      if (own?.id !== shared.id) await keepArgument(db, user, shared.id)
      return {}
    }
    default:
      return null
  }
}
