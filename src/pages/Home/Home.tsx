import { Link } from 'react-router-dom'
import nightCityImage from '../../assets/images/night-city.png'
import { LinkButton } from '../../components/Button/Button'
import { DiscussionCard } from '../../components/DiscussionCard/DiscussionCard'
import { PageMarker } from '../../components/PageMarker/PageMarker'
import { trendingDiscussion } from '../../data/discussions'

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
        <p className="mobile-only">
          Explore characters, districts and stories — then join the community
          and share your take.
        </p>
        <p className="desktop-only">
          Explore Night City, its characters and stories — then join
          discussions with other players.
        </p>
        <LinkButton to="/night-city">Explore Night City</LinkButton>
      </section>

      <section className="featured-section">
        <h2 className="desktop-only">Featured this week</h2>
        <nav aria-label="Featured this week" className="featured-cyber">
          <Link className="featured-cyber__card featured-cyber__card--yellow" to="/characters">
            <strong><span className="mobile-only">Johnny</span><span className="desktop-only">Johnny Silverhand</span></strong>
            <span><span className="mobile-only">Legend</span><span className="desktop-only">Rockerboy · Rebel</span></span>
          </Link>
          <Link className="featured-cyber__card featured-cyber__card--red" to="/characters">
            <strong><span className="mobile-only">Judy</span><span className="desktop-only">Judy Alvarez</span></strong>
            <span><span className="mobile-only">Braindance</span><span className="desktop-only">Braindance · Mox</span></span>
          </Link>
          <Link className="featured-cyber__card featured-cyber__card--cyan desktop-only" to="/night-city">
            <strong>Japantown</strong>
            <span>Westbrook · Neon</span>
          </Link>
          <Link className="featured-cyber__card featured-cyber__card--yellow desktop-only" to="/community">
            <strong>Community</strong>
            <span>2.8K discussions</span>
          </Link>
        </nav>
      </section>

      <section className="home-trending">
        <h2 className="section-label">Trending discussion</h2>
        <DiscussionCard discussion={trendingDiscussion} variant="trending" />
      </section>

      <PageMarker index="01" label="Home" />
    </div>
  )
}
