import type { Character } from '../../data/characters'

interface CharacterCardProps {
  character: Character
  isFavorite: boolean
  onToggleFavorite: (id: string) => void
}

export function CharacterCard({
  character,
  isFavorite,
  onToggleFavorite,
}: CharacterCardProps) {
  const rating = character.rating + Number(isFavorite)

  return (
    <article className="character-card">
      <div className="character-card__image-wrap">
        <img
          alt={character.imageAlt}
          className="character-card__image"
          src={character.image}
          style={{ objectPosition: character.imagePosition }}
        />
        <span className="character-card__index" aria-hidden="true">
          NC // {character.id === 'v' ? '01' : character.id === 'johnny-silverhand' ? '02' : '03'}
        </span>
      </div>
      <div className="character-card__body">
        <p className="eyebrow">{character.role}</p>
        <h2>{character.name}</h2>
        <p>{character.description}</p>
        <button
          aria-label={`${isFavorite ? 'Remove' : 'Add'} ${character.name} ${isFavorite ? 'from' : 'to'} favorites`}
          aria-pressed={isFavorite}
          className={`favorite-button${isFavorite ? ' is-active' : ''}`}
          onClick={() => onToggleFavorite(character.id)}
          type="button"
        >
          <span aria-hidden="true">★</span>
          <span>{isFavorite ? 'Favorited' : 'Favorite'}</span>
          <strong>{rating.toLocaleString()}</strong>
        </button>
      </div>
    </article>
  )
}
