export interface Discussion {
  id: string
  title: string
  excerpt: string
  author: string
  time: string
  tag: string
  likes: number
  replies: number
}

export const discussions: Discussion[] = [
  {
    id: 'phantom-liberty-ending',
    title: 'Which Phantom Liberty ending stayed with you?',
    excerpt:
      'No wrong answers—just tag the major spoilers. I keep returning to the quiet choices after the final mission.',
    author: 'netrunner_77',
    time: '12 min ago',
    tag: 'Story',
    likes: 128,
    replies: 34,
  },
  {
    id: 'best-night-city-build',
    title: 'Your most fun build for roaming Night City',
    excerpt:
      'Forget the meta for a minute. What combination of cyberware and weapons creates the best moment-to-moment chaos?',
    author: 'chrome_heart',
    time: '48 min ago',
    tag: 'Builds',
    likes: 96,
    replies: 27,
  },
  {
    id: 'favorite-district-details',
    title: 'Small district details most players miss',
    excerpt:
      'Post the signs, alleys, NPC routines, and strange corners that made the city feel alive to you.',
    author: 'afterlife_local',
    time: '2 hr ago',
    tag: 'Night City',
    likes: 211,
    replies: 51,
  },
]
