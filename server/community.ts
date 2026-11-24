import { randomUUID } from 'node:crypto'
import type { CharacterRecord, Discussion, District, DilemmaQuestion, Outing, PollOption, Profile, Reply, SiteData } from '../shared/community.ts'
import { execute, one, rows, type Db } from './db.ts'
import { boolean, field, HttpError, slug } from './validate.ts'

export async function establishProfile(db: Db, user: { id: string, name: string }) {
  // The Better Auth identity is the source of the display name.
  const current = await one(db, 'SELECT user_id FROM profiles WHERE user_id = ?', [user.id])
  if (!current) {
    await execute(db, 'INSERT INTO profiles (user_id, username) VALUES (?, ?) ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)', [user.id, user.name])
  }
}

export async function siteData(db: Db, user: string | null): Promise<SiteData> {
  const [account, characters, districts, outings, dilemmas, poll, favorites, saved, ratings, discussions] = await Promise.all([
    user ? one<Profile>(db, `SELECT username, hide_spoilers AS hideSpoilers, first_community_at IS NOT NULL AS participated
      FROM profiles WHERE user_id = ?`, [user]) : null,
    rows<CharacterRecord>(db, `SELECT id, name, role, category, description, image_key AS imageKey,
      image_alt AS imageAlt, image_position AS imagePosition, accent FROM characters ORDER BY position`),
    rows<District>(db, 'SELECT id, name, description FROM districts ORDER BY position'),
    rows<Outing>(db, 'SELECT id, district_id AS districtId, title, prompt FROM outing_templates ORDER BY position'),
    rows<DilemmaQuestion>(db, `SELECT c.id, c.name, d.question FROM character_dilemmas d
      JOIN characters c ON c.id = d.character_id ORDER BY d.position`),
    rows<PollOption>(db, `SELECT o.id, o.label, o.symbol,
      (SELECT COUNT(*) FROM fan_poll_votes v WHERE v.option_id = o.id) AS total,
      EXISTS (SELECT 1 FROM fan_poll_votes v WHERE v.option_id = o.id AND v.user_id = ?) AS selected
      FROM fan_poll_options o ORDER BY o.position`, [user]),
    user ? rows<{ id: string }>(db, 'SELECT character_id AS id FROM favorite_characters WHERE user_id = ?', [user]) : [],
    user ? rows<{ id: string }>(db, 'SELECT district_id AS id FROM saved_districts WHERE user_id = ?', [user]) : [],
    one<{ own: number | null, average: string | null }>(db, `SELECT MAX(CASE WHEN user_id = ? THEN rating END) AS own,
      AVG(rating) AS average FROM character_collection_ratings`, [user]),
    rows<Discussion & { createdAt: Date }>(db, `SELECT d.id, d.title, d.body AS excerpt,
      COALESCE(p.username, d.seed_author) AS author, d.created_at AS createdAt, d.spoiler,
      d.tag, d.accent, d.character_id AS characterId, d.district_id AS districtId,
      (SELECT COUNT(*) FROM discussion_replies r WHERE r.discussion_id = d.id) AS replies,
      (SELECT COUNT(*) FROM discussion_likes l WHERE l.discussion_id = d.id) AS likes,
      EXISTS (SELECT 1 FROM discussion_likes l WHERE l.discussion_id = d.id AND l.user_id = ?) AS liked,
      COALESCE(d.author_id = ?, FALSE) AS mine,
      (? IS NOT NULL AND (COALESCE(d.author_id = ?, FALSE) OR EXISTS (
        SELECT 1 FROM discussion_replies r WHERE r.discussion_id = d.id AND r.author_id = ?
      ))) AS myActivity
      FROM discussions d LEFT JOIN profiles p ON p.user_id = d.author_id
      ORDER BY d.created_at DESC, d.id`, [user, user, user, user, user]),
  ])
  return {
    profile: account ? { ...account, hideSpoilers: Boolean(account.hideSpoilers), participated: Boolean(account.participated) } : null,
    characters, districts, outings, dilemmas,
    poll: poll.map((option) => ({ ...option, total: Number(option.total), selected: Boolean(option.selected) })),
    favoriteCharacters: favorites.map(({ id }) => id),
    savedDistricts: saved.map(({ id }) => id),
    rating: ratings?.own ?? 0,
    ratingAverage: ratings?.average == null ? null : Number(ratings.average),
    discussions: discussions.map((item) => ({
      ...item, createdAt: item.createdAt.toISOString(), likes: Number(item.likes), replies: Number(item.replies),
      spoiler: Boolean(item.spoiler), liked: Boolean(item.liked), mine: Boolean(item.mine), myActivity: Boolean(item.myActivity),
    })),
  }
}

export function markParticipation(db: Db, user: string) {
  return execute(db, 'UPDATE profiles SET first_community_at = COALESCE(first_community_at, UTC_TIMESTAMP(3)) WHERE user_id = ?', [user])
}

export function discussionReplies(db: Db, id: string) {
  return rows<Reply>(db, `SELECT r.id, p.username AS author, r.body AS text
    FROM discussion_replies r JOIN profiles p ON p.user_id = r.author_id
    WHERE r.discussion_id = ? ORDER BY r.created_at, r.id`, [id])
}

const selections = {
  favorite: { table: 'favorite_characters', column: 'character_id' },
  district: { table: 'saved_districts', column: 'district_id' },
  vote: { table: 'fan_poll_votes', column: 'option_id' },
  like: { table: 'discussion_likes', column: 'discussion_id' },
} as const

export async function setSelection(db: Db, user: string, kind: keyof typeof selections, id: string, selected: boolean) {
  const { table, column } = selections[kind]
  if (selected) {
    await execute(db, `INSERT INTO ${table} (user_id, ${column}) VALUES (?, ?) ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)`, [user, id])
    if (kind === 'like') await markParticipation(db, user)
  } else {
    await execute(db, `DELETE FROM ${table} WHERE user_id = ? AND ${column} = ?`, [user, id])
  }
}

export async function addDiscussion(db: Db, user: string, data: Record<string, unknown>, id: string = randomUUID()): Promise<string> {
  await execute(db, `INSERT INTO discussions (id, author_id, title, body, spoiler)
    VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id = VALUES(id)`,
  [id, user, field(data.title, 80, 'a title'), field(data.text, 360, 'a message'), boolean(data.spoiler)])
  await markParticipation(db, user)
  return id
}

export async function addReply(db: Db, user: string, discussion: string, text: string, id: string = randomUUID()) {
  await execute(db, `INSERT INTO discussion_replies (id, discussion_id, author_id, body)
    VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE id = VALUES(id)`, [id, discussion, user, text])
  await markParticipation(db, user)
}

export async function setRating(db: Db, user: string, rating: unknown, keepExisting = false) {
  if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) throw new HttpError(400, 'Choose a rating from 1 to 5.')
  await execute(db, `INSERT INTO character_collection_ratings (user_id, rating) VALUES (?, ?)
    ON DUPLICATE KEY UPDATE rating = ${keepExisting ? 'rating' : 'VALUES(rating)'}`, [user, rating])
}

export async function communityAction(db: Db, user: string, action: string, data: Record<string, unknown>) {
  switch (action) {
    case 'favorite': case 'district': case 'like': case 'vote':
      await setSelection(db, user, action, slug(data.id), boolean(data.selected))
      return {}
    case 'rating':
      await setRating(db, user, data.rating)
      return {}
    case 'spoilers':
      await execute(db, 'UPDATE profiles SET hide_spoilers = ? WHERE user_id = ?', [boolean(data.hidden), user])
      return {}
    case 'discussion':
      return { id: await addDiscussion(db, user, data) }
    case 'reply':
      await addReply(db, user, slug(data.discussionId), field(data.text, 240, 'a reply'))
      return {}
    default:
      return null
  }
}
