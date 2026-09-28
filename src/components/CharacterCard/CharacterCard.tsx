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
  const displayName =
    character.id === 'v'
      ? `${character.name} / ${character.role}`
      : character.name

  return (
    <article className={`character-card character-card--${character.accent}`}>
      <button
        aria-label={`${isFavorite ? 'Remove' : 'Add'} ${character.name} ${isFavorite ? 'from' : 'to'} favorites`}
        aria-pressed={isFavorite}
        className={`character-card__favorite${isFavorite ? ' is-active' : ''}`}
        onClick={() => onToggleFavorite(character.id)}
        type="button"
      >
        <span aria-hidden="true">{isFavorite ? '★' : '☆'}</span>
      </button>
      <img
        alt={character.imageAlt}
        className="character-card__image"
        src={character.image}
        style={{ objectPosition: character.imagePosition }}
      />
      <span className="character-card__shade" aria-hidden="true" />
      <div className="character-card__body">
        <h2>{displayName}</h2>
        <p>{character.description}</p>
        <span className="character-card__accent" aria-hidden="true" />
      </div>
    </article>
  )
}
