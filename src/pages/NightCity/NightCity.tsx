import japantownImage from '../../assets/images/japantown.jpeg'
import { PageMarker } from '../../components/PageMarker/PageMarker'
import { ReactionButton } from '../../components/ReactionButton/ReactionButton'
import { districts } from '../../data/districts'

const featuredDistricts = districts.filter(
  (district) => district.id === 'watson' || district.id === 'pacifica',
)

const desktopDistricts = [
  { id: 'watson', name: 'Watson', description: 'Markets & megabuildings' },
  { id: 'westbrook', name: 'Westbrook', description: 'Luxury & neon nightlife' },
  { id: 'pacifica', name: 'Pacifica', description: 'Broken dreams & gangs' },
  { id: 'heywood', name: 'Heywood', description: 'Community & street culture' },
]

export function NightCity() {
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
          <p className="desktop-only night-city-intro">
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
              <dt><span className="mobile-only">Vibe</span><span className="desktop-only">Fan favorite</span></dt>
              <dd><span className="mobile-only">Neon</span><span className="desktop-only">Japantown</span></dd>
            </div>
          </dl>
        </div>
      </div>

      <h2 className="desktop-only night-city-section-title">Explore districts</h2>

      <section aria-label="Featured Night City districts" className="district-grid mobile-only">
        {featuredDistricts.map((district) => (
          <article
            className={`district-card district-card--${district.id}`}
            key={district.id}
          >
            <h2>{district.name}</h2>
            <p>{district.description}</p>
            <span aria-hidden="true" />
          </article>
        ))}
      </section>

      <section aria-label="Night City districts" className="district-grid district-grid--desktop desktop-only">
        {desktopDistricts.map((district) => (
          <article
            className={`district-card district-card--${district.id}`}
            key={district.id}
          >
            <h2>{district.name}</h2>
            <p>{district.description}</p>
          </article>
        ))}
      </section>

      <ReactionButton
        activeLabel="District saved"
        className="district-reaction"
        initialCount={864}
        label="Save district"
        storageKey="district:japantown"
        symbol="★"
      />

      <PageMarker index="03" label="Night City" />
    </div>
  )
}
