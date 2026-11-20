import { makeShareLink, readShareId, readShareJson, readShareObject, readShareText, shareParams } from './shareLinks'

export const characterDilemmas = [
  { id: 'v', name: 'V', question: 'When a contract clashes with your conscience, where should V draw the line?' },
  { id: 'johnny-silverhand', name: 'Johnny Silverhand', question: 'Does fighting a corrupt system excuse the harm done along the way?' },
  { id: 'judy-alvarez', name: 'Judy Alvarez', question: 'When is staying to help worth the cost of giving up a fresh start?' },
]

export interface DilemmaArgument {
  id: string
  characterId: string
  text: string
  spoiler: boolean
}

export function readDilemmaArgument(hash: string): DilemmaArgument | null {
  const value = readShareObject(readShareJson(shareParams(hash).get('argument')))
  const id = readShareId(value?.id)
  const text = readShareText(value?.text)
  const dilemma = characterDilemmas.find((item) => item.id === value?.characterId)
  if (value?.version !== 1 || !id || !text || !dilemma || typeof value.spoiler !== 'boolean') return null
  return { id, text, characterId: dilemma.id, spoiler: value.spoiler }
}

export function makeArgumentLink(argument: DilemmaArgument) {
  return makeShareLink(`/characters?dilemma=${encodeURIComponent(argument.characterId)}`, new URLSearchParams({
    argument: JSON.stringify({ version: 1, ...argument }),
  }))
}
