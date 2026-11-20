import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { GlitchContent } from '../../components/Button/GlitchContent'
import { CharacterCard } from '../../components/CharacterCard/CharacterCard'
import { InteractionStatus } from '../../components/InteractionStatus/InteractionStatus'
import { PageMarker } from '../../components/PageMarker/PageMarker'
import { ReactionButton } from '../../components/ReactionButton/ReactionButton'
import { RelatedDiscussions } from '../../components/RelatedDiscussions/RelatedDiscussions'
import { characters, type Character } from '../../data/characters'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { useTransientStatus } from '../../hooks/useTransientStatus'
import { CharacterDilemmas } from './CharacterDilemmas'

type CharacterFilter = 'all' | 'favorites' | Character['category']

const filters: Array<{ value: CharacterFilter; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'favorites', label: 'Favorites' },
  { value: 'merc', label: 'Merc' },
  { value: 'rockerboy', label: 'Rockerboy' },
  { value: 'tech', label: 'Tech' },
]

export function Characters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedFilter = searchParams.get('filter')
  const filter = filters.find(({ value }) => value === requestedFilter)?.value ?? 'all'
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
        <p>Select the star on a character card to add an ally to your profile.</p>
      </header>

      {visibleCharacters.length > 0 ? (
        <section aria-label="Character profiles" className="character-grid">
          {visibleCharacters.map((character) => {
            const dilemmaParams = new URLSearchParams(searchParams)
            dilemmaParams.set('dilemma', character.id)
            return (
              <div className="character-profile" key={character.id}>
                <CharacterCard character={character} isFavorite={favorites.includes(character.id)} onToggleFavorite={toggleFavorite} />
                <Link className="outings__journal-link" to={`?${dilemmaParams.toString()}#character-dilemmas-title`}>
                  <GlitchContent>Open dilemma for {character.name}</GlitchContent>
                </Link>
              </div>
            )
          })}
        </section>
      ) : (
        <div className="collection-empty-state" role="status">
          <h2>No favorites yet</h2>
          <p>Choose All and select the star on a character card.</p>
        </div>
      )}

      <RelatedDiscussions favoriteCharacterIds={favorites} />
      <CharacterDilemmas />

      <section className="favorite-prompt">
        <h2 className="section-label section-label--white">Fan poll</h2>
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
          <div aria-label="Filter characters" className="collection-filter" role="group">
            {filters.map((option) => (
              <button
                aria-pressed={filter === option.value}
                key={option.value}
                onClick={() => setSearchParams(
                  option.value === 'all' ? {} : { filter: option.value },
                  { replace: true },
                )}
                type="button"
              >
                <GlitchContent>{option.label}</GlitchContent>
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
                <GlitchContent><span aria-hidden="true">★</span></GlitchContent>
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
