export interface OutingStop {
  id: string
  title: string
  prompt: string
}

export interface Outing extends OutingStop {
  districtId: string
  previousStops?: OutingStop[]
}

export type InGameTime = 'day' | 'night'

export function readInGameTime(value: unknown): InGameTime | undefined {
  return value === 'day' || value === 'night' ? value : undefined
}

export const outings: Outing[] = [
  {
    id: 'watson-market-detail',
    districtId: 'watson',
    title: 'A detail in the market',
    prompt: 'Walk through a market in Watson. Pick a stall, sign, or object you would normally pass by. What does it tell you about the people who spend their day there?',
  },
  {
    id: 'westbrook-japantown-stop',
    districtId: 'westbrook',
    title: 'Somewhere to stop',
    prompt: 'Take a walk through Japantown and find a spot that makes you want to stop. What caught your attention there?',
  },
  {
    id: 'pacifica-quiet-corner',
    districtId: 'pacifica',
    title: 'A quiet corner',
    prompt: 'Find a quiet spot in Pacifica. Pause there for a moment and notice what you can hear. Which sound would you remember after leaving?',
  },
  {
    id: 'heywood-meeting-place',
    districtId: 'heywood',
    title: 'A place to meet',
    prompt: 'Walk a block in Heywood and choose a place you would use to meet a friend. What makes it easy to recognize?',
  },
]
