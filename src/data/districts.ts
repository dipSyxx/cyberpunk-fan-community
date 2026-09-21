import japantownImage from '../assets/images/japantown.jpeg'
import nightCityImage from '../assets/images/night-city.png'

export interface District {
  id: string
  name: string
  zone: string
  description: string
  image: string
  imageAlt: string
  saves: number
  imagePosition?: string
}

export const districts: District[] = [
  {
    id: 'japantown',
    name: 'Japantown',
    zone: 'Westbrook',
    description:
      'Neon markets, luxury towers, and a nightlife that never admits when the party is over.',
    image: japantownImage,
    imageAlt: 'Crowds and glowing lanterns at a Japantown festival',
    saves: 854,
  },
  {
    id: 'watson',
    name: 'Watson',
    zone: 'Northside',
    description:
      'Old industry, dense streets, and ambitious mercs starting from the bottom.',
    image: nightCityImage,
    imageAlt: 'Night City streets and high-rise buildings in daylight',
    saves: 672,
    imagePosition: 'left center',
  },
  {
    id: 'pacifica',
    name: 'Pacifica',
    zone: 'Coastview',
    description:
      'An abandoned resort district where broken promises became a new kind of freedom.',
    image: nightCityImage,
    imageAlt: 'Sunlit Night City skyline viewed from street level',
    saves: 519,
    imagePosition: 'right center',
  },
]
