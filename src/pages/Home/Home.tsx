import { Link } from 'react-router-dom'
import nightCityImage from '../../assets/images/night-city.png'
import { LinkButton } from '../../components/Button/Button'
import { GlitchContent } from '../../components/Button/GlitchContent'
import { Outings } from '../../components/Outings/Outings'
import { PageMarker } from '../../components/PageMarker/PageMarker'
import { RelatedDiscussions } from '../../components/RelatedDiscussions/RelatedDiscussions'
import { useCommunity } from '../../api/communityContext'
import { LegacyImport } from '../../components/Auth/LegacyImport'

const favoritesPath = '/characters?filter=favorites'
const savedDistrictsPath = '/night-city?filter=saved'

interface Mission {
  label: string
  description: string
  to: string
  complete: boolean
  accent: 'yellow' | 'cyan' | 'red'
}

export function Home() {
  const { site: { profile, characters, districts, favoriteCharacters: favoriteCharacterIds,
    savedDistricts: savedDistrictIds, rating: characterRating, discussions } } = useCommunity()
  const myPosts = discussions.filter((discussion) => discussion.mine)

  const favoriteCharacters = characters.filter(({ id }) => favoriteCharacterIds.includes(id))
  const savedDistricts = districts.filter(({ id }) => savedDistrictIds.includes(id))
  const missions: Mission[] = [
    {
      label: 'Pick your ally',
      description: favoriteCharacters.length
        ? `${favoriteCharacters.length} favorite ${favoriteCharacters.length === 1 ? 'character' : 'characters'}`
        : 'Select the star on a character card',
      to: favoriteCharacters.length ? favoritesPath : '/characters',
      complete: favoriteCharacters.length > 0,
      accent: 'yellow',
    },
    {
      label: 'Save a district',
      description: savedDistricts.length
        ? `${savedDistricts.length} saved ${savedDistricts.length === 1 ? 'district' : 'districts'}`
        : 'Mark a place to remember',
      to: savedDistricts.length ? savedDistrictsPath : '/night-city',
      complete: savedDistricts.length > 0,
      accent: 'cyan',
    },
    {
      label: 'Join a discussion',
      description:
        profile?.participated
          ? 'Community activity recorded'
          : 'Like, reply, or create a post',
      to: '/community',
      complete: Boolean(profile?.participated),
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
        <p className="home-copy__kicker">Night City fan community</p>
        <h1 className="glitch-heading">Make Night City yours</h1>
        <p>
          Choose your allies, save the districts you love, and join the fan
          conversation. Sign in to save your progress across devices.
        </p>
        <LinkButton to="/characters">Build my profile</LinkButton>
      </section>

      <section aria-labelledby="profile-title" className="night-profile">
        <header className="night-profile__heading">
          <div>
            {profile && <p>@{profile.username}</p>}
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

        <Outings savedDistrictIds={savedDistrictIds} />

        <dl className="night-profile__stats">
          <div>
            <dt>Favorite characters</dt>
            <dd>
              {favoriteCharacters.length ? (
                <Link className="night-profile__collection-link" to={favoritesPath}>
                  <GlitchContent>{favoriteCharacters.map(({ name }) => name).join(', ')}</GlitchContent>
                </Link>
              ) : '—'}
            </dd>
          </div>
          <div>
            <dt>Saved districts</dt>
            <dd>
              {savedDistricts.length ? (
                <Link className="night-profile__collection-link" to={savedDistrictsPath}>
                  <GlitchContent>{savedDistricts.map(({ name }) => name).join(', ')}</GlitchContent>
                </Link>
              ) : '—'}
            </dd>
          </div>
          <div>
            <dt>Character rating</dt>
            <dd>{characterRating ? `${characterRating} / 5` : '—'}</dd>
          </div>
          <div>
            <dt>Your posts</dt>
            <dd>{myPosts.length}</dd>
          </div>
        </dl>

        <RelatedDiscussions favoriteCharacterIds={favoriteCharacterIds} savedDistrictIds={savedDistrictIds} />
        {profile && <LegacyImport username={profile.username} />}
      </section>

      <section className="journey-section">
        <div className="journey-section__heading">
          <h2>Continue your journey</h2>
          <p>Complete all three steps to shape your Night City profile.</p>
        </div>
        <nav aria-label="Your Night City missions" className="mission-grid">
          {missions.map((mission, index) => (
            <Link
              className={`mission-card mission-card--${mission.accent}${mission.complete ? ' is-complete' : ''}`}
              key={mission.label}
              to={mission.to}
            >
              <GlitchContent>
                <span className="mission-card__step">
                  0{index + 1} / {mission.complete ? 'Complete' : 'Open'}
                </span>
                <strong>{mission.label}</strong>
                <span>{mission.description}</span>
                <span className="mission-card__action" aria-hidden="true">
                  {mission.complete ? 'Review' : 'Start'} →
                </span>
              </GlitchContent>
            </Link>
          ))}
        </nav>
      </section>

      <PageMarker index="01" label="Your Night City" />
    </div>
  )
}
