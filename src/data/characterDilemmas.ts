import type { Argument, DilemmaQuestion } from '../../shared/community'
import { readShareId, readShareJson, readShareObject, readShareText, shareParams } from './shareLinks'

export function readDilemmaArgument(hash: string, characterDilemmas: DilemmaQuestion[]): Argument | null {
  const value = readShareObject(readShareJson(shareParams(hash).get('argument')))
  const id = readShareId(value?.id)
  const text = readShareText(value?.text)
  const dilemma = characterDilemmas.find((item) => item.id === value?.characterId)
  if (value?.version !== 1 || !id || !text || !dilemma || typeof value.spoiler !== 'boolean') return null
  return { id, text, characterId: dilemma.id, spoiler: value.spoiler }
}
