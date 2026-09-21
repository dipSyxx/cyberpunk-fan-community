import johnnyImage from '../assets/images/johnny.png'
import judyImage from '../assets/images/judy.png'
import vImage from '../assets/images/v.jpeg'

export interface Character {
  id: string
  name: string
  role: string
  description: string
  image: string
  imageAlt: string
  rating: number
  imagePosition?: string
}

export const characters: Character[] = [
  {
    id: 'v',
    name: 'V',
    role: 'Mercenary',
    description:
      'A rising Night City merc chasing the one job that could rewrite every rule.',
    image: vImage,
    imageAlt: 'V seated in a dark Night City apartment',
    rating: 2184,
    imagePosition: 'center 30%',
  },
  {
    id: 'johnny-silverhand',
    name: 'Johnny Silverhand',
    role: 'Rockerboy / Rebel',
    description:
      'A digital ghost with unfinished business, a silver arm, and no patience for corps.',
    image: johnnyImage,
    imageAlt: 'Johnny Silverhand standing beneath cold blue lights',
    rating: 2417,
    imagePosition: 'center 28%',
  },
  {
    id: 'judy-alvarez',
    name: 'Judy Alvarez',
    role: 'Braindance Technician',
    description:
      'A gifted techie and fierce friend determined to leave Night City better than she found it.',
    image: judyImage,
    imageAlt: 'Judy Alvarez standing against a dark background',
    rating: 1926,
    imagePosition: 'center top',
  },
]
