import { useEffect, useRef, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ActionButton } from '../../components/Button/Button'
import { ServerShareLink } from '../../components/ShareLink/ServerShareLink'
import type { Collection, JournalEntry } from '../../../shared/community'
import { useCommunity, useResource } from '../../api/communityContext'
import { sharedToken } from '../../api/share'
import { useFeedbackAction } from '../../api/useFeedbackAction'
import { districtJournalPath } from '../../data/districtJournal'
import { districtCollectionLimit, readSharedCollection } from '../../data/districtShares'
import { readShareText, shareTitleLimit } from '../../data/shareLinks'

function CollectionNotes({ entries }: { entries: JournalEntry[] }) {
  return <ol className="journal-notes">{entries.map(({ id, note }) => <li key={id}>{note}</li>)}</ol>
}

interface DistrictCollectionsProps {
  districtId: string
  entries: JournalEntry[]
  collections: Collection[]
}

export function DistrictCollections({ districtId, entries, collections }: DistrictCollectionsProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { site: { profile } } = useCommunity()
  const { message, setMessage, busy, save } = useFeedbackAction()
  const previewRef = useRef<HTMLDivElement>(null)
  const token = sharedToken(location.hash, 'collection')
  const hasLink = Boolean(token) || location.hash.startsWith('#collection=')
  const shared = useResource<{ districtId: string, collection: Collection }>(token ? 'shared/collection' : null, token)
  const incoming = token ? shared.value?.districtId === districtId ? shared.value.collection : null
    : hasLink ? readSharedCollection(location.hash, districtId) : null

  useEffect(() => {
    if (hasLink) previewRef.current?.focus()
  }, [hasLink, location.hash])

  const createCollection = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const title = readShareText(data.get('title'), shareTitleLimit)
    const ids = new Set(data.getAll('entry'))
    const selected = entries.filter(({ id }) => ids.has(id))
    if (!title || selected.length < 2 || selected.length > districtCollectionLimit) {
      setMessage('Name the collection and choose two or three notes.')
      return
    }
    if (await save('create-collection', { districtId, title, entries: selected.map(({ id }) => id) }, 'Collection saved.')) form.reset()
  }

  async function saveIncoming(value: Collection) {
    if (await save('save-collection', { districtId, ...(token ? { token } : { legacy: value }) }, 'Collection saved.')) closePreview()
  }

  const closePreview = () => navigate({ pathname: location.pathname, search: location.search, hash: '' }, { replace: true })

  return (
    <section aria-labelledby="district-collections-title" className="journal-panel">
      <h2 id="district-collections-title">District collections</h2>
      {hasLink && (
        <div className="journal-panel journal-panel--preview" ref={previewRef} tabIndex={-1}>
          <h3>{incoming?.title ?? 'Shared collection'}</h3>
          {incoming ? <CollectionNotes entries={incoming.entries} /> : <p role="status">{shared.loading ? "Opening collection?" : shared.error?.message ?? "This collection link is invalid or belongs to another district."}</p>}
          <div className="outings__actions">
            {incoming && (profile ? <ActionButton disabled={busy} onClick={() => void saveIncoming(incoming)}>Save collection</ActionButton> : <p>Log in to save this collection.</p>)}
            <ActionButton onClick={closePreview} variant="secondary">Close preview</ActionButton>
          </div>
        </div>
      )}
      {entries.length >= 2 ? (
        <details>
          <summary>Build a collection</summary>
          <form className="journal-form" onSubmit={(event) => void createCollection(event)}>
            <label className="journal-field">Collection title<input maxLength={shareTitleLimit} name="title" required /></label>
            <fieldset className="journal-choices">
              <legend>Choose 2–{districtCollectionLimit} notes</legend>
              {entries.map(({ id, note }) => (
                <label key={id}><input name="entry" type="checkbox" value={id} /><span>{note}</span></label>
              ))}
            </fieldset>
            <ActionButton disabled={busy} type="submit">Create collection</ActionButton>
          </form>
        </details>
      ) : !collections.length && !hasLink && <p>Add two district notes to build a collection.</p>}
      {collections.map((collection) => (
        <article className="journal-panel" key={collection.id}>
          <h3>{collection.title}</h3>
          <CollectionNotes entries={collection.entries} />
          <details>
            <summary>Share collection</summary>
            <ServerShareLink label="Collection link" path={districtJournalPath(districtId)} name="collection" action="share-collection" data={{ id: collection.id }} token={collection.token} />
          </details>
          {collection.entries.some(({ id }) => !entries.some((entry) => entry.id === id)) && (
            <ActionButton disabled={busy} onClick={() => void save('copy-collection', { id: collection.id }, 'Notes added to your journal.')} variant="secondary">Add notes to journal</ActionButton>
          )}
        </article>
      ))}
      {message && <p role="status">{message}</p>}
    </section>
  )
}
