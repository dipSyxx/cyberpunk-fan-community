export interface District {
  id: string
  name: string
  description: string
}

export const districts: District[] = [
  {
    id: 'watson',
    name: 'Watson',
    description: 'Markets & megabuildings',
  },
  {
    id: 'westbrook',
    name: 'Westbrook',
    description: 'Luxury & neon nightlife',
  },
  {
    id: 'pacifica',
    name: 'Pacifica',
    description: 'Broken dreams & gangs',
  },
  {
    id: 'heywood',
    name: 'Heywood',
    description: 'Community & street culture',
  },
]
