import { useMemo, useState } from 'react'
import { CharacterCard } from '../../components/CharacterCard/CharacterCard'
import { characters } from '../../data/characters'
import { useLocalStorage } from '../../hooks/useLocalStorage'

type CharacterFilter = 'all' | 'favorites'

export function Characters() {
  const [filter, setFilter] = useState<CharacterFilter>('all')
  const [favorites, setFavorites] = useLocalStorage<string[]>(
    'cyberpunk:favorite-characters',
    [],
  )

  const visibleCharacters = useMemo(
    () =>
      filter === 'favorites'
        ? characters.filter((character) => favorites.includes(character.id))
        : characters,
    [favorites, filter],
  )

  const toggleFavorite = (id: string) => {
    setFavorites((current) =>
      current.includes(id)
        ? current.filter((favoriteId) => favoriteId !== id)
        : [...current, id],
    )
  }

  return (
    <div className="page-shell content-shell">
      <header className="page-intro">
        <p className="eyebrow">Database // Character archive</p>
        <h1>Night City legends</h1>
        <p>
          Mercs, rebels, and dreamers who refuse to let the city write their
          final chapter.
        </p>
      </header>

      <div aria-label="Filter characters" className="filter-bar" role="group">
        <button
          aria-pressed={filter === 'all'}
          className={filter === 'all' ? 'is-active' : undefined}
          onClick={() => setFilter('all')}
          type="button"
        >
          All files <span>{characters.length}</span>
        </button>
        <button
          aria-pressed={filter === 'favorites'}
          className={filter === 'favorites' ? 'is-active' : undefined}
          onClick={() => setFilter('favorites')}
          type="button"
        >
          Favorites <span>{favorites.length}</span>
        </button>
      </div>

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
        <div className="empty-state">
          <p className="eyebrow">No saved files</p>
          <h2>Your favorites list is empty.</h2>
          <p>Choose “All files” and select the star on a character profile.</p>
        </div>
      )}
    </div>
  )
}
