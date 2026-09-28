import japantownImage from '../../assets/images/japantown.jpeg'
import { PageMarker } from '../../components/PageMarker/PageMarker'
import { districts } from '../../data/districts'
import { useLocalStorage } from '../../hooks/useLocalStorage'

export function NightCity() {
  const [savedDistricts, setSavedDistricts] = useLocalStorage<string[]>(
    'cyberpunk:saved-districts',
    [],
  )

  const toggleDistrict = (id: string) => {
    setSavedDistricts((current) =>
      current.includes(id)
        ? current.filter((districtId) => districtId !== id)
        : [...current, id],
    )
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

      <h2 className="night-city-section-title">
        Explore districts
        <span>{savedDistricts.length} / {districts.length} saved</span>
      </h2>

      <section aria-label="Night City districts" className="district-grid">
        {districts.map((district) => {
          const isSaved = savedDistricts.includes(district.id)

          return (
            <article
              className={`district-card district-card--${district.id}${isSaved ? ' is-saved' : ''}`}
              key={district.id}
            >
              <h2>{district.name}</h2>
              <p>{district.description}</p>
              <span aria-hidden="true" />
              <button
                aria-label={`${isSaved ? 'Remove' : 'Save'} ${district.name} ${isSaved ? 'from' : 'to'} saved districts`}
                aria-pressed={isSaved}
                className="district-card__save"
                onClick={() => toggleDistrict(district.id)}
                type="button"
              >
                <span aria-hidden="true">{isSaved ? '★' : '☆'}</span>
              </button>
            </article>
          )
        })}
      </section>

      <PageMarker index="03" label="Night City" />
    </div>
  )
}
