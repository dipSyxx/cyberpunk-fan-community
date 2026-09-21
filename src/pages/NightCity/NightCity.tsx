import japantownImage from '../../assets/images/japantown.jpeg'
import { ReactionButton } from '../../components/ReactionButton/ReactionButton'
import { districts } from '../../data/districts'

export function NightCity() {
  return (
    <>
      <section className="hero hero--district">
        <img
          alt="A crowded Japantown festival beneath neon lanterns"
          className="hero__image"
          src={japantownImage}
        />
        <div className="hero__scrim" />
        <div className="content-shell hero__content">
          <p className="eyebrow eyebrow--bright">Westbrook // Sector 04</p>
          <h1>Japantown</h1>
          <p className="hero__lede">
            Tradition rendered in neon—where every alley offers another deal,
            secret, or reason to stay until sunrise.
          </p>
          <ReactionButton
            activeLabel="District saved"
            initialCount={854}
            label="Save district"
            storageKey="district:japantown:hero"
            symbol="＋"
          />
        </div>
      </section>

      <div className="content-shell page-shell">
        <header className="section-heading section-heading--wide">
          <div>
            <p className="eyebrow">City guide // Districts</p>
            <h2>Choose your streets</h2>
          </div>
          <p>
            Save a district to build a personal route through Night City. Your
            choices remain on this device.
          </p>
        </header>

        <section aria-label="Night City districts" className="district-grid">
          {districts.map((district) => (
            <article className="district-card" key={district.id}>
              <div className="district-card__image-wrap">
                <img
                  alt={district.imageAlt}
                  src={district.image}
                  style={{ objectPosition: district.imagePosition }}
                />
                <span>{district.zone}</span>
              </div>
              <div className="district-card__body">
                <div>
                  <p className="eyebrow">District file</p>
                  <h2>{district.name}</h2>
                </div>
                <p>{district.description}</p>
                <ReactionButton
                  activeLabel="Saved"
                  initialCount={district.saves}
                  label="Save district"
                  storageKey={`district:${district.id}`}
                  symbol="＋"
                />
              </div>
            </article>
          ))}
        </section>
      </div>
    </>
  )
}
