import { useMemo, useState } from 'react'
import { CharacterCard } from '../../components/CharacterCard/CharacterCard'
import { InteractionStatus } from '../../components/InteractionStatus/InteractionStatus'
import { PageMarker } from '../../components/PageMarker/PageMarker'
import { ReactionButton } from '../../components/ReactionButton/ReactionButton'
import { characters, type Character } from '../../data/characters'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { useTransientStatus } from '../../hooks/useTransientStatus'

type CharacterFilter = 'all' | 'favorites' | Character['category']

const filters: Array<{ value: CharacterFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'favorites', label: 'Favorites' },
  { value: 'merc', label: 'Merc' },
  { value: 'rockerboy', label: 'Rockerboy' },
  { value: 'tech', label: 'Tech' },
]

export function Characters() {
  const [filter, setFilter] = useState<CharacterFilter>('all')
  const [favorites, setFavorites] = useLocalStorage<string[]>(
    'cyberpunk:favorite-characters',
    [],
  )
  const [rating, setRating] = useLocalStorage<number>(
    'cyberpunk:character-rating',
    0,
  )
  const { status, showStatus } = useTransientStatus()

  const visibleCharacters = useMemo(() => {
    if (filter === 'favorites') {
      return characters.filter((character) => favorites.includes(character.id))
    }

    if (filter === 'all') return characters
    return characters.filter((character) => character.category === filter)
  }, [favorites, filter])

  const toggleFavorite = (id: string) => {
    const character = characters.find((item) => item.id === id)
    const isFavorite = favorites.includes(id)

    setFavorites((current) =>
      current.includes(id)
        ? current.filter((favoriteId) => favoriteId !== id)
        : [...current, id],
    )

    if (character) {
      showStatus(
        isFavorite
          ? `${character.name} removed from Your Night City`
          : `${character.name} added to Your Night City`,
      )
    }
  }

  return (
    <div className="figma-page figma-page--characters">
      <header className="page-title">
        <h1 className="glitch-heading glitch-heading--yellow">Characters</h1>
        <p>Meet the people shaping Night City and vote for your favorites.</p>
      </header>

      {visibleCharacters.length > 0 ? (
        <section aria-label="Character profiles" className="character-grid">
          {visibleCharacters.map((character) => (
            <CharacterCard
              character={character}
              isFavorite={favorites.includes(character.id)}
              key={character.id}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </section>
      ) : (
        <div className="character-empty-state" role="status">
          <h2>No favorites yet</h2>
          <p>Choose All and select the star on a character card.</p>
        </div>
      )}

      <section className="favorite-prompt">
        <h2 className="section-label section-label--white">Fan favorites</h2>
        <div className="favorite-prompt__reactions">
          <ReactionButton
            activeLabel="Johnny"
            compactCount
            initialCount={2400}
            label="Johnny"
            storageKey="character:johnny-silverhand"
          />
          <ReactionButton
            activeLabel="Judy"
            compactCount
            initialCount={1900}
            label="Judy"
            storageKey="character:judy-alvarez"
            symbol="★"
          />
          <ReactionButton
            activeLabel="Panam"
            compactCount
            initialCount={1700}
            label="Panam"
            storageKey="character:panam-palmer"
          />
        </div>
      </section>

      <section aria-label="Character insights" className="character-insights">
        <article className="character-insight character-insight--cyan">
          <h2>Filter by role</h2>
          <div aria-label="Filter characters" className="character-filter" role="group">
            {filters.map((option) => (
              <button
                aria-pressed={filter === option.value}
                className={filter === option.value ? 'is-active' : undefined}
                key={option.value}
                onClick={() => setFilter(option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </article>
        <article className="character-insight character-insight--red">
          <h2>Community rating</h2>
          <div aria-label="Rate the character collection" className="character-rating" role="radiogroup">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                aria-label={`${value} star${value === 1 ? '' : 's'}`}
                aria-checked={rating === value}
                className={value <= rating ? 'is-active' : undefined}
                key={value}
                onClick={() => {
                  setRating(value)
                  showStatus(`Your rating: ${value} / 5`)
                }}
                role="radio"
                type="button"
              >
                <span aria-hidden="true">★</span>
              </button>
            ))}
          </div>
          <p>{rating ? `Your rating: ${rating} / 5` : '4.8 / 5 community average'}</p>
        </article>
      </section>

      <PageMarker index="02" label="Characters" />
      <InteractionStatus status={status} />
    </div>
  )
}
