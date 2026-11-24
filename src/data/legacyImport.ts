type LegacyRecord = Record<string, unknown>

function isRecord(value: unknown): value is LegacyRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function saved(key: string): unknown {
  const value = window.localStorage.getItem(key)
  if (value === null) return undefined
  try {
    return JSON.parse(value) as unknown
  } catch {
    throw new Error('Some browser data could not be read. Your original data is still in this browser.')
  }
}

function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

export function hasLegacyData() {
  try {
    return Object.keys(window.localStorage).some((key) => key.startsWith('cyberpunk:') && key !== 'cyberpunk:local-auth')
  } catch {
    return false
  }
}

export function readLegacyData() {
  const favoriteCharacters = array(saved('cyberpunk:favorite-characters'))
  const savedDistricts = array(saved('cyberpunk:saved-districts'))
  const rating = saved('cyberpunk:character-rating')
  const participated = saved('cyberpunk:community-participated')
  const hideSpoilers = saved('cyberpunk:hide-spoilers')
  const outings = saved('cyberpunk:outing-journal')
  const discussions = array(saved('cyberpunk:local-discussions'))
  const votes: string[] = []
  const likes: string[] = []
  const replies: Record<string, unknown[]> = Object.create(null)
  const journals: Record<string, LegacyRecord> = Object.create(null)
  const dilemmas: LegacyRecord = Object.create(null)

  for (const key of Object.keys(window.localStorage)) {
    const match = key.match(/^cyberpunk:(reaction:character|reaction:discussion|discussion-replies|district-journal|district-collections|finding-checks|character-dilemma):([a-z0-9][a-z0-9-]{0,63})$/)
    if (!match) continue
    const [, kind, id] = match
    const value = saved(key)
    if (kind === 'reaction:character' && value === true) votes.push(id)
    if (kind === 'reaction:discussion' && value === true) likes.push(id)
    if (kind === 'discussion-replies' && array(value).length) replies[id] = array(value)
    if (kind === 'character-dilemma' && isRecord(value)) dilemmas[id] = value
    if (kind === 'district-journal' || kind === 'district-collections' || kind === 'finding-checks') {
      const entry = journals[id] ?? {}
      const name = kind === 'district-journal' ? 'entries' : kind === 'district-collections' ? 'collections' : 'checks'
      entry[name] = array(value)
      journals[id] = entry
    }
  }
  return { favoriteCharacters, savedDistricts, rating, participated, hideSpoilers, outings, discussions, votes, likes, replies, journals, dilemmas }
}

export function legacySections(data: ReturnType<typeof readLegacyData>) {
  const outings = isRecord(data.outings) ? data.outings : {}
  const journalGroups = Object.values(data.journals)
  const dilemmaGroups = Object.values(data.dilemmas).filter(isRecord)
  return [
    { label: 'Favorite characters', count: data.favoriteCharacters.length },
    { label: 'Saved districts', count: data.savedDistricts.length },
    { label: 'Fan poll votes', count: data.votes.length },
    { label: 'Community likes', count: data.likes.length },
    { label: 'Character collection rating', count: data.rating ? 1 : 0 },
    { label: 'Saved spoiler preference', count: typeof data.hideSpoilers === 'boolean' ? 1 : 0 },
    { label: 'Community participation', count: data.participated === true ? 1 : 0 },
    { label: 'Active and completed outings', count: array(outings.entries).length + Number(Boolean(outings.activeOutingId)) },
    { label: 'Saved fan clues', count: array(outings.savedClues).length },
    { label: 'District notes', count: journalGroups.reduce((total, group) => total + array(group.entries).length, 0) },
    { label: 'District collections', count: journalGroups.reduce((total, group) => total + array(group.collections).length, 0) },
    { label: 'Finding checks', count: journalGroups.reduce((total, group) => total + array(group.checks).length, 0) },
    { label: 'Dilemma responses and saved arguments', count: dilemmaGroups.reduce((total, group) => total + Number(Boolean(group.own)) + array(group.received).length, 0) },
  ].filter(({ count }) => count > 0)
}

export function legacyPostLabel(value: unknown) {
  return isRecord(value) && typeof value.title === 'string' && typeof value.excerpt === 'string'
    ? { title: value.title, message: value.excerpt } : null
}
