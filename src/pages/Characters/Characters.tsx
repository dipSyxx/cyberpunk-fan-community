import { CharacterCard } from '../../components/CharacterCard/CharacterCard'
import { PageMarker } from '../../components/PageMarker/PageMarker'
import { ReactionButton } from '../../components/ReactionButton/ReactionButton'
import { characters } from '../../data/characters'

export function Characters() {
  return (
    <div className="figma-page figma-page--characters">
      <header className="page-title">
        <h1 className="glitch-heading glitch-heading--yellow">Characters</h1>
        <p>Meet the people shaping Night City and vote for your favorites.</p>
      </header>

      <section aria-label="Character profiles" className="character-grid">
        {characters.map((character) => (
          <CharacterCard character={character} key={character.id} />
        ))}
      </section>

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
          <p>Merc · Fixer · Rockerboy · Netrunner</p>
        </article>
        <article className="character-insight character-insight--red">
          <h2>Community rating</h2>
          <p>4.8 / 5 average character rating</p>
        </article>
      </section>

      <PageMarker index="02" label="Characters" />
    </div>
  )
}
