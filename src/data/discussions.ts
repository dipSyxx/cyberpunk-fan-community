export interface Discussion {
  id: string
  title: string
  excerpt: string
  author: string
  time: string
  tag: string
  likes: number
  replies: number
  accent?: 'cyan' | 'red' | 'yellow'
}

export const trendingDiscussion: Discussion = {
  id: 'best-district-at-night',
  title: 'Best district at night',
  excerpt:
    'Which district has the best atmosphere at night? For me it is Japantown.',
  author: 'netrunner77',
  time: '12 min',
  tag: 'Night City',
  likes: 42,
  replies: 8,
  accent: 'cyan',
}

export const discussions: Discussion[] = [
  {
    id: 'hardest-ending',
    title: 'Which ending hit you the hardest?',
    excerpt:
      'I keep coming back to the Star ending. The contrast between Night City and freedom outside the walls is brutal.',
    author: 'netrunner77',
    time: '12 min ago',
    tag: 'Story',
    likes: 128,
    replies: 34,
    accent: 'cyan',
  },
  {
    id: 'screenshot-locations',
    title: 'Best place for screenshots in Night City?',
    excerpt:
      'Japantown at night is unbeatable, but the Badlands at sunrise deserves more love.',
    author: 'mox_judy',
    time: '48 min ago',
    tag: 'Night City',
    likes: 96,
    replies: 21,
    accent: 'red',
  },
  {
    id: 'johnny-hero-villain',
    title: 'Johnny: hero, villain, or both?',
    excerpt:
      'He is selfish, charismatic and destructive — but that is exactly why the character works so well.',
    author: 'samurai_fan',
    time: '2 hr ago',
    tag: 'Characters',
    likes: 241,
    replies: 67,
    accent: 'yellow',
  },
]
