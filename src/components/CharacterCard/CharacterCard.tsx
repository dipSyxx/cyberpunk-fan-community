import type { Character } from '../../data/characters'

interface CharacterCardProps {
  character: Character
}

export function CharacterCard({ character }: CharacterCardProps) {
  const displayName =
    character.id === 'v'
      ? `${character.name} / ${character.role}`
      : character.name

  return (
    <article className={`character-card character-card--${character.accent}`}>
      <img
        alt={character.imageAlt}
        className="character-card__image"
        src={character.image}
        style={{ objectPosition: character.imagePosition }}
      />
      <span className="character-card__shade" aria-hidden="true" />
      <div className="character-card__body">
        <h2>{displayName}</h2>
        <p className={character.desktopDescription ? 'mobile-only' : undefined}>
          {character.description}
        </p>
        {character.desktopDescription ? (
          <p className="desktop-only">{character.desktopDescription}</p>
        ) : null}
        <span className="character-card__accent" aria-hidden="true" />
      </div>
    </article>
  )
}
