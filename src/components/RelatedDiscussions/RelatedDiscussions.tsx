import { Link } from 'react-router-dom'
import { discussions } from '../../data/discussions'

interface RelatedDiscussionsProps {
  favoriteCharacterIds?: string[]
  savedDistrictIds?: string[]
}

export function RelatedDiscussions({
  favoriteCharacterIds = [],
  savedDistrictIds = [],
}: RelatedDiscussionsProps) {
  const relatedDiscussions = discussions.filter(({ characterId, districtId }) =>
    (characterId && favoriteCharacterIds.includes(characterId)) ||
    (districtId && savedDistrictIds.includes(districtId)),
  )

  if (relatedDiscussions.length === 0) return null

  return (
    <section aria-label="Related discussions" className="related-discussions">
      <h2>Related discussions</h2>
      <ul>
        {relatedDiscussions.map(({ id, title }) => (
          <li key={id}>
            <Link to={`/community?thread=${encodeURIComponent(id)}`}>{title}</Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
