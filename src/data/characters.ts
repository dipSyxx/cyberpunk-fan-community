import johnnyImage from '../assets/images/johnny.png'
import judyImage from '../assets/images/judy.png'
import vImage from '../assets/images/v.jpeg'
import type { CharacterRecord } from '../../shared/community'

const images = new Map([
  ['v', vImage],
  ['johnny-silverhand', johnnyImage],
  ['judy-alvarez', judyImage],
])

export function withCharacterImage(character: CharacterRecord) {
  return { ...character, image: images.get(character.imageKey) }
}
