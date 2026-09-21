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
  accent: 'yellow' | 'cyan' | 'red'
  imagePosition?: string
}

export const characters: Character[] = [
  {
    id: 'v',
    name: 'V',
    role: 'Mercenary',
    description: 'Relic carrier · Afterlife regular',
    image: vImage,
    imageAlt: 'V seated in a dark Night City apartment',
    rating: 2184,
    accent: 'yellow',
    imagePosition: 'center 30%',
  },
  {
    id: 'johnny-silverhand',
    name: 'Johnny Silverhand',
    role: 'Rockerboy / Rebel',
    description: 'Rockerboy · Rebel · Digital ghost',
    image: johnnyImage,
    imageAlt: 'Johnny Silverhand standing beneath cold blue lights',
    rating: 2417,
    accent: 'cyan',
    imagePosition: 'center 28%',
  },
  {
    id: 'judy-alvarez',
    name: 'Judy Alvarez',
    role: 'Braindance Technician',
    description: 'Braindance tech · Mox ally',
    image: judyImage,
    imageAlt: 'Judy Alvarez standing against a dark background',
    rating: 1926,
    accent: 'red',
    imagePosition: 'center top',
  },
]
