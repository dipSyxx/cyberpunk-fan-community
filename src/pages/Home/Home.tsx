import { Link } from 'react-router-dom'
import nightCityImage from '../../assets/images/night-city.png'
import { LinkButton } from '../../components/Button/Button'
import { DiscussionCard } from '../../components/DiscussionCard/DiscussionCard'
import { characters } from '../../data/characters'
import { discussions } from '../../data/discussions'

export function Home() {
  const featuredCharacters = characters.slice(1)

  return (
    <>
      <section className="hero hero--home">
        <img
          alt="Sunlight cutting through the towers and streets of Night City"
          className="hero__image"
          src={nightCityImage}
        />
        <div className="hero__scrim" />
        <div className="content-shell hero__content">
          <p className="eyebrow eyebrow--bright">Night City // 2077</p>
          <h1>
            Wake up,
            <br />
            <span>samurai.</span>
          </h1>
          <p className="hero__lede">
            Stories, people, and street-level intel from the city that never
            stops asking what you are willing to become.
          </p>
          <LinkButton to="/night-city">Explore Night City</LinkButton>
        </div>
        <div className="hero__data" aria-hidden="true">
          <span>35.6762° N</span>
          <span>Network // Online</span>
        </div>
      </section>

      <section className="content-shell section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Featured files</p>
            <h2>People of Night City</h2>
          </div>
          <Link className="text-link" to="/characters">
            View all characters <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="featured-grid">
          {featuredCharacters.map((character) => (
            <Link
              aria-label={`View ${character.name} on the characters page`}
              className="featured-character"
              key={character.id}
              to="/characters"
            >
              <img
                alt={character.imageAlt}
                src={character.image}
                style={{ objectPosition: character.imagePosition }}
              />
              <span className="featured-character__overlay" />
              <span className="featured-character__content">
                <small>{character.role}</small>
                <strong>{character.name}</strong>
                <span>Open file ↗</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section-block section-block--surface">
        <div className="content-shell">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Live feed</p>
              <h2>Trending discussion</h2>
            </div>
            <Link className="text-link" to="/community">
              Enter community <span aria-hidden="true">→</span>
            </Link>
          </div>
          <DiscussionCard discussion={discussions[0]} />
        </div>
      </section>
    </>
  )
}
