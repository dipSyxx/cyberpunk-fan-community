import { Link } from 'react-router-dom'
import { useCommunity } from '../../api/communityContext'
import { GlitchContent } from '../Button/GlitchContent'

interface RelatedDiscussionsProps {
  favoriteCharacterIds?: string[]
  savedDistrictIds?: string[]
}

export function RelatedDiscussions({
  favoriteCharacterIds = [],
  savedDistrictIds = [],
}: RelatedDiscussionsProps) {
  const { site: { discussions, profile } } = useCommunity()
  const relatedDiscussions = discussions.filter(({ characterId, districtId }) =>
    (characterId && favoriteCharacterIds.includes(characterId)) ||
    (districtId && savedDistrictIds.includes(districtId)),
  )

  if (relatedDiscussions.length === 0) return null

  const hideSpoilers = profile?.hideSpoilers ?? true

  return (
    <section aria-label="Related discussions" className="related-discussions">
      <h2>Related discussions</h2>
      <ul>
        {relatedDiscussions.map((discussion) => (
          <li key={discussion.id}>
            <Link to={`/community?thread=${encodeURIComponent(discussion.id)}`}>
              <GlitchContent>
                {hideSpoilers && discussion.spoiler ? 'Hidden story discussion' : discussion.title}
              </GlitchContent>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
