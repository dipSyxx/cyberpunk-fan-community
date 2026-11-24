export type InGameTime = 'day' | 'night'
export type FindingResult = 'confirmed' | 'different' | 'notFound'
export type Accent = 'yellow' | 'cyan' | 'red'

export interface Profile {
  username: string
  hideSpoilers: boolean
  participated: boolean
}

export interface CharacterRecord {
  id: string
  name: string
  role: string
  category: 'merc' | 'rockerboy' | 'tech'
  description: string
  imageKey: string
  imageAlt: string
  imagePosition: string | null
  accent: Accent
}

export interface District {
  id: string
  name: string
  description: string
}

export interface OutingStop {
  id: string
  title: string
  prompt: string
}

export interface Outing extends OutingStop {
  districtId: string
  previousStops?: OutingStop[]
  token?: string
}

export interface OutingRun {
  id: string
  outing: Outing
  note: string | null
  inGameTime: InGameTime | null
  completedAt: string | null
}

export interface OutingsData {
  active: OutingRun | null
  entries: OutingRun[]
  savedClues: Outing[]
}

export interface PollOption {
  id: string
  label: string
  symbol: 'heart' | 'star'
  total: number
  selected: boolean
}

export interface Discussion {
  id: string
  title: string
  excerpt: string
  author: string
  createdAt: string
  tag: string
  likes: number
  replies: number
  spoiler: boolean
  characterId: string | null
  districtId: string | null
  accent: Accent
  liked: boolean
  mine: boolean
  myActivity: boolean
}

export interface Reply {
  id: string
  author: string
  text: string
}

export interface DilemmaQuestion {
  id: string
  name: string
  question: string
}

export interface SiteData {
  profile: Profile | null
  characters: CharacterRecord[]
  districts: District[]
  outings: Outing[]
  dilemmas: DilemmaQuestion[]
  poll: PollOption[]
  favoriteCharacters: string[]
  savedDistricts: string[]
  rating: number
  ratingAverage: number | null
  discussions: Discussion[]
}

export interface JournalEntry {
  id: string
  note: string
  createdAt: string
  imported?: boolean
}

export interface Collection {
  id: string
  title: string
  entries: JournalEntry[]
  token?: string
}

export interface FindingRequest {
  id: string
  note: string
  place: string
  time: InGameTime
  token?: string
}

export interface FindingObservation extends JournalEntry {
  sourceId: string
  time: InGameTime
  result: FindingResult
  token?: string
}

export interface FindingCheck {
  request: FindingRequest
  reports: FindingObservation[]
}

export interface SharedFinding {
  districtId: string
  request: FindingRequest
  report?: FindingObservation
}

export interface DistrictJournal {
  entries: JournalEntry[]
  collections: Collection[]
  checks: FindingCheck[]
}

export interface Argument {
  id: string
  characterId: string
  text: string
  spoiler: boolean
  token?: string
}

export interface DilemmaJournal {
  own: Argument | null
  received: Argument[]
}
