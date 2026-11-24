import { addDiscussion, addReply, markParticipation, setRating, setSelection } from './community.ts'
import { execute, one, type Db } from './db.ts'
import { importArgument, saveResponse } from './dilemmas.ts'
import { checkedEntry, importCollection, importFinding, saveEntry } from './journals.ts'
import { importClue, saveClue } from './outings.ts'
import { importedId } from './shares.ts'
import { boolean, date, field, HttpError, inGameTime, list, record, slug } from './validate.ts'

export async function importLegacy(db: Db, user: string, input: Record<string, unknown>) {
  const personal = boolean(input.personal)
  const publish = boolean(input.publish)
  if (!personal && !publish) throw new HttpError(400, 'Choose which data to import.')
  const data = record(input.data)
  if (personal) {
    for (const [key, kind] of [['favoriteCharacters', 'favorite'], ['savedDistricts', 'district'], ['votes', 'vote'], ['likes', 'like']] as const) {
      for (const item of list(data[key] ?? [], 1000)) {
        const id = slug(item)
        // Local discussions are attributed to an account only when explicitly published.
        if (kind !== 'like' || !id.startsWith('local-')) await setSelection(db, user, kind, id, true)
      }
    }
    if (data.rating && data.rating !== 0) await setRating(db, user, data.rating, true)
    if (data.participated === true) await markParticipation(db, user)
    if (typeof data.hideSpoilers === 'boolean') {
      await execute(db, 'UPDATE profiles SET hide_spoilers = ? WHERE user_id = ?', [data.hideSpoilers, user])
    }
    const journal = record(data.outings ?? {})
    for (const item of list(journal.savedClues ?? [], 500)) await saveClue(db, user, await importClue(db, user, item))
    for (const value of list(journal.entries ?? [], 1000)) {
      const entry = record(value)
      if (!Number.isSafeInteger(entry.id) || Number(entry.id) < 1) throw new HttpError(400, 'Invalid outing entry.')
      const clue = entry.clue ? await importClue(db, user, entry.clue) : null
      const template = clue ? null : slug(entry.outingId)
      const completedAt = date(entry.completedAt)
      await execute(db, `INSERT INTO outing_runs (id, user_id, template_id, clue_id, note, in_game_time, started_at, completed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id = VALUES(id)`,
      [importedId(user, 'outing', `${entry.id}:${entry.completedAt}`), user, template, clue, field(entry.note, 240, 'a note'),
        entry.inGameTime == null ? null : inGameTime(entry.inGameTime), completedAt, completedAt])
    }
    if (journal.activeOutingId && !await one(db, 'SELECT id FROM outing_runs WHERE active_for = ?', [user])) {
      const clue = journal.activeClue ? await importClue(db, user, journal.activeClue) : null
      const template = clue ? null : slug(journal.activeOutingId)
      await execute(db, `INSERT INTO outing_runs (id, user_id, template_id, clue_id) VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE id = VALUES(id)`, [importedId(user, 'active', String(journal.activeOutingId)), user, template, clue])
      if (clue) await execute(db, 'DELETE FROM saved_fan_clues WHERE user_id = ? AND clue_id = ?', [user, clue])
    }
    for (const [id, value] of Object.entries(record(data.journals ?? {}))) {
      const district = slug(id)
      const items = record(value)
      for (const item of list(items.entries ?? [], 1000)) {
        await saveEntry(db, user, district, checkedEntry(item), record(item).imported === true)
      }
      for (const item of list(items.collections ?? [], 500)) await importCollection(db, user, district, item)
      for (const value of list(items.checks ?? [], 500)) {
        const item = record(value)
        await importFinding(db, user, district, item.request, list(item.reports ?? [], 500))
      }
    }
    for (const [id, value] of Object.entries(record(data.dilemmas ?? {}))) {
      const character = slug(id)
      const journal = record(value)
      if (journal.own) {
        const own = record(journal.own)
        await saveResponse(db, user, character, field(own.text, 240, 'a response'), boolean(own.spoiler), true)
      }
      for (const item of list(journal.received ?? [], 500)) await importArgument(db, user, character, item)
    }
  }

  if (publish) {
    for (const value of list(data.discussions ?? [], 1000)) {
      const item = record(value)
      const legacyId = slug(item.id)
      if (!legacyId.startsWith('local-')) throw new HttpError(400, 'Invalid browser post.')
      await addDiscussion(db, user, { title: item.title, text: item.excerpt, spoiler: item.spoiler ?? false },
        importedId(user, 'discussion', legacyId))
    }
    for (const [id, values] of Object.entries(record(data.replies ?? {}))) {
      const original = slug(id)
      const discussion = original.startsWith('local-') ? importedId(user, 'discussion', original) : original
      if (!await one(db, 'SELECT id FROM discussions WHERE id = ?', [discussion])) {
        throw new HttpError(409, 'A browser reply refers to a missing discussion.')
      }
      for (const [index, value] of list(values, 1000).entries()) {
        const text = field(value, 240, 'a reply')
        await addReply(db, user, discussion, text, importedId(user, 'reply', JSON.stringify([original, index, text])))
      }
    }
    if (personal) {
      for (const item of list(data.likes ?? [], 1000)) {
        const id = slug(item)
        if (!id.startsWith('local-')) continue
        const discussion = importedId(user, 'discussion', id)
        if (await one(db, 'SELECT id FROM discussions WHERE id = ?', [discussion])) await setSelection(db, user, 'like', discussion, true)
      }
    }
  }
  return {}
}
