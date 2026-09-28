import { Link } from 'react-router-dom'
import nightCityImage from '../../assets/images/night-city.png'
import { LinkButton } from '../../components/Button/Button'
import { PageMarker } from '../../components/PageMarker/PageMarker'
import { useLocalStorage } from '../../hooks/useLocalStorage'

interface Mission {
  label: string
  description: string
  to: string
  complete: boolean
  accent: 'yellow' | 'cyan' | 'red'
}

export function Home() {
  const [favoriteCharacters] = useLocalStorage<string[]>(
    'cyberpunk:favorite-characters',
    [],
  )
  const [savedDistricts] = useLocalStorage<string[]>(
    'cyberpunk:saved-districts',
    [],
  )
  const [characterRating] = useLocalStorage<number>(
    'cyberpunk:character-rating',
    0,
  )
  const [localDiscussions] = useLocalStorage<unknown[]>(
    'cyberpunk:local-discussions',
    [],
  )
  const [hasParticipated] = useLocalStorage<boolean>(
    'cyberpunk:community-participated',
    false,
  )

  const missions: Mission[] = [
    {
      label: 'Pick your ally',
      description: favoriteCharacters.length
        ? `${favoriteCharacters.length} favorite ${favoriteCharacters.length === 1 ? 'character' : 'characters'}`
        : 'Choose a favorite character',
      to: '/characters',
      complete: favoriteCharacters.length > 0,
      accent: 'yellow',
    },
    {
      label: 'Save a district',
      description: savedDistricts.length
        ? `${savedDistricts.length} saved ${savedDistricts.length === 1 ? 'district' : 'districts'}`
        : 'Mark a place to remember',
      to: '/night-city',
      complete: savedDistricts.length > 0,
      accent: 'cyan',
    },
    {
      label: 'Join a discussion',
      description:
        hasParticipated || localDiscussions.length > 0
          ? 'Local activity recorded'
          : 'Like, reply, or create a post',
      to: '/community',
      complete: hasParticipated || localDiscussions.length > 0,
      accent: 'red',
    },
  ]
  const completedMissions = missions.filter((mission) => mission.complete).length

  return (
    <div className="figma-page figma-page--home">
      <section className="media-card media-card--home">
        <img
          alt="Sunlight cutting through the towers and streets of Night City"
          src={nightCityImage}
        />
        <span className="media-card__shade" aria-hidden="true" />
        <span className="media-card__accent" aria-hidden="true" />
        <h2>Your city. Your choices.</h2>
      </section>

      <section className="home-copy">
        <p className="home-copy__kicker">Local fan profile</p>
        <h1 className="glitch-heading">Make Night City yours</h1>
        <p>
          Choose your allies, save the districts you love, and join the fan
          conversation. Everything is stored locally on this device.
        </p>
        <LinkButton to="/characters">Build my profile</LinkButton>
      </section>

      <section aria-labelledby="profile-title" className="night-profile">
        <header className="night-profile__heading">
          <div>
            <p>Your local profile</p>
            <h2 id="profile-title">Your Night City</h2>
          </div>
          <p className="night-profile__progress-copy">
            <strong>{completedMissions} / 3</strong>
            <span>missions completed</span>
          </p>
        </header>

        <progress
          aria-label={`${completedMissions} of 3 profile missions completed`}
          max="3"
          value={completedMissions}
        />

        <dl className="night-profile__stats">
          <div>
            <dt>Favorite characters</dt>
            <dd>{favoriteCharacters.length}</dd>
          </div>
          <div>
            <dt>Saved districts</dt>
            <dd>{savedDistricts.length}</dd>
          </div>
          <div>
            <dt>Character rating</dt>
            <dd>{characterRating ? `${characterRating} / 5` : '—'}</dd>
          </div>
          <div>
            <dt>Local posts</dt>
            <dd>{localDiscussions.length}</dd>
          </div>
        </dl>
      </section>

      <section className="journey-section">
        <div className="journey-section__heading">
          <h2>Continue your journey</h2>
          <p>Complete all three steps to shape your local Night City profile.</p>
        </div>
        <nav aria-label="Your Night City missions" className="mission-grid">
          {missions.map((mission, index) => (
            <Link
              className={`mission-card mission-card--${mission.accent}${mission.complete ? ' is-complete' : ''}`}
              key={mission.label}
              to={mission.to}
            >
              <span className="mission-card__step">
                0{index + 1} / {mission.complete ? 'Complete' : 'Open'}
              </span>
              <strong>{mission.label}</strong>
              <span>{mission.description}</span>
              <span className="mission-card__action" aria-hidden="true">
                {mission.complete ? 'Review' : 'Start'} →
              </span>
            </Link>
          ))}
        </nav>
      </section>

      <PageMarker index="01" label="Your Night City" />
    </div>
  )
}
