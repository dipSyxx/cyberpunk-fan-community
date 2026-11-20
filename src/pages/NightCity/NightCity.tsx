import { Link, useSearchParams } from 'react-router-dom'
import japantownImage from '../../assets/images/japantown.jpeg'
import { GlitchContent } from '../../components/Button/GlitchContent'
import { InteractionStatus } from '../../components/InteractionStatus/InteractionStatus'
import { PageMarker } from '../../components/PageMarker/PageMarker'
import { RelatedDiscussions } from '../../components/RelatedDiscussions/RelatedDiscussions'
import { districts } from '../../data/districts'
import { districtJournalPath } from '../../data/districtJournal'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { useTransientStatus } from '../../hooks/useTransientStatus'

export function NightCity() {
  const [searchParams, setSearchParams] = useSearchParams()
  const showSaved = searchParams.get('filter') === 'saved'
  const [savedDistricts, setSavedDistricts] = useLocalStorage<string[]>(
    'cyberpunk:saved-districts',
    [],
  )
  const { status, showStatus } = useTransientStatus()
  const saved = districts.filter(({ id }) => savedDistricts.includes(id))
  const visibleDistricts = showSaved ? saved : districts

  const toggleDistrict = (id: string) => {
    const district = districts.find((item) => item.id === id)
    const isSaved = savedDistricts.includes(id)

    setSavedDistricts((current) =>
      current.includes(id)
        ? current.filter((districtId) => districtId !== id)
        : [...current, id],
    )

    if (district) {
      showStatus(
        isSaved
          ? `${district.name} removed from Your Night City`
          : `${district.name} saved to Your Night City`,
      )
    }
  }

  return (
    <div className="figma-page figma-page--night-city">
      <div className="night-city-hero">
        <section className="media-card media-card--japantown">
          <img
            alt="A crowded Japantown festival beneath neon lanterns"
            src={japantownImage}
          />
          <span className="media-card__shade" aria-hidden="true" />
          <span className="media-card__accent" aria-hidden="true" />
          <h2>Japantown / Westbrook</h2>
        </section>

        <div className="night-city-copy">
          <h1 className="glitch-heading glitch-heading--yellow">Night City</h1>
          <p className="night-city-intro">
            A city of ambition, danger and impossible choices.
          </p>

          <dl className="city-facts">
            <div>
              <dt>Districts</dt>
              <dd>6</dd>
            </div>
            <div>
              <dt>Founded</dt>
              <dd>1994</dd>
            </div>
            <div>
              <dt>Fan favorite</dt>
              <dd>Japantown</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="district-heading">
        <h2 className="night-city-section-title">
          Explore districts
          <span>{saved.length} / {districts.length} saved</span>
        </h2>
        <div aria-label="Filter districts" className="collection-filter" role="group">
          <button
            aria-pressed={!showSaved}
            onClick={() => setSearchParams({}, { replace: true })}
            type="button"
          >
            <GlitchContent>All districts</GlitchContent>
          </button>
          <button
            aria-pressed={showSaved}
            onClick={() => setSearchParams({ filter: 'saved' }, { replace: true })}
            type="button"
          >
            <GlitchContent>Saved districts</GlitchContent>
          </button>
        </div>
      </div>

      {visibleDistricts.length > 0 ? (
        <section aria-label="Night City districts" className="district-grid">
          {visibleDistricts.map((district) => {
            const isSaved = savedDistricts.includes(district.id)

            return (
              <article
                className={`district-card district-card--${district.id}${isSaved ? ' is-saved' : ''}`}
                key={district.id}
              >
                <h2>{district.name}</h2>
                <p>{district.description}</p>
                <span aria-hidden="true" />
                <Link
                  aria-label={`${district.name} journal`}
                  className="district-card__journal"
                  to={districtJournalPath(district.id)}
                >
                  <GlitchContent>Journal</GlitchContent>
                </Link>
                <button
                  aria-label={`${isSaved ? 'Remove' : 'Save'} ${district.name} ${isSaved ? 'from' : 'to'} saved districts`}
                  aria-pressed={isSaved}
                  className="district-card__save"
                  onClick={() => toggleDistrict(district.id)}
                  type="button"
                >
                  <GlitchContent>
                    <span aria-hidden="true">{isSaved ? '★' : '☆'}</span>
                  </GlitchContent>
                </button>
              </article>
            )
          })}
        </section>
      ) : (
        <div className="collection-empty-state" role="status">
          <h2>No saved districts yet</h2>
          <p>Choose All districts and select the star on a district card.</p>
        </div>
      )}

      <RelatedDiscussions savedDistrictIds={savedDistricts} />

      <PageMarker index="03" label="Night City" />
      <InteractionStatus status={status} />
    </div>
  )
}
