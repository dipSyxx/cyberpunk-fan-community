import { Link } from 'react-router-dom'
import nightCityImage from '../../assets/images/night-city.png'
import { LinkButton } from '../../components/Button/Button'
import { PageMarker } from '../../components/PageMarker/PageMarker'

export function Home() {
  return (
    <div className="figma-page figma-page--home">
      <section className="media-card media-card--home">
        <img
          alt="Sunlight cutting through the towers and streets of Night City"
          src={nightCityImage}
        />
        <span className="media-card__shade" aria-hidden="true" />
        <span className="media-card__accent" aria-hidden="true" />
        <h2>Welcome to Night City</h2>
      </section>

      <section className="home-copy">
        <h1 className="glitch-heading">Wake up, samurai</h1>
        <p>
          Explore Night City, its characters and stories — then join
          discussions with other players.
        </p>
        <LinkButton to="/night-city">Explore Night City</LinkButton>
      </section>

      <section className="featured-section">
        <h2>Featured this week</h2>
        <nav aria-label="Featured this week" className="featured-cyber">
          <Link className="featured-cyber__card featured-cyber__card--yellow" to="/characters">
            <strong>Johnny Silverhand</strong>
            <span>Rockerboy · Rebel</span>
          </Link>
          <Link className="featured-cyber__card featured-cyber__card--red" to="/characters">
            <strong>Judy Alvarez</strong>
            <span>Braindance · Mox</span>
          </Link>
          <Link className="featured-cyber__card featured-cyber__card--cyan" to="/night-city">
            <strong>Japantown</strong>
            <span>Westbrook · Neon</span>
          </Link>
          <Link className="featured-cyber__card featured-cyber__card--yellow" to="/community">
            <strong>Community</strong>
            <span>2.8K discussions</span>
          </Link>
        </nav>
      </section>

      <PageMarker index="01" label="Home" />
    </div>
  )
}
