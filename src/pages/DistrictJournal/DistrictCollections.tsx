import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ActionButton } from '../../components/Button/Button'
import { ShareLink } from '../../components/ShareLink/ShareLink'
import type { DistrictJournalEntry } from '../../data/districtJournal'
import { districtCollectionLimit, makeCollectionLink, readSharedCollection, type DistrictCollection } from '../../data/districtShares'
import { readShareText, shareTitleLimit } from '../../data/shareLinks'
import { readStoredValue, writeStoredValue } from '../../hooks/useLocalStorage'

function CollectionNotes({ entries }: { entries: DistrictJournalEntry[] }) {
  return <ol className="journal-notes">{entries.map(({ id, note }) => <li key={id}>{note}</li>)}</ol>
}

interface DistrictCollectionsProps {
  districtId: string
  entries: DistrictJournalEntry[]
  addNotes: (entries: DistrictJournalEntry[]) => number | false
}

export function DistrictCollections({ districtId, entries, addNotes }: DistrictCollectionsProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const storageKey = `cyberpunk:district-collections:${districtId}`
  const [collections, setCollections] = useState(() => readStoredValue<DistrictCollection[]>(storageKey, []))
  const [message, setMessage] = useState('')
  const previewRef = useRef<HTMLDivElement>(null)
  const hasLink = location.hash.startsWith('#collection=')
  const incoming = hasLink ? readSharedCollection(location.hash, districtId) : null

  useEffect(() => {
    if (hasLink) previewRef.current?.focus()
  }, [hasLink, location.hash])

  const save = (collection: DistrictCollection) => {
    const stored = readStoredValue(storageKey, collections)
    if (stored.some(({ id }) => id === collection.id)) {
      setCollections(stored)
      setMessage('This collection is already saved.')
      return true
    }
    const next = [collection, ...stored]
    if (!writeStoredValue(storageKey, next)) {
      setMessage('Could not save the collection in this browser.')
      return false
    }
    setCollections(next)
    setMessage('Collection saved.')
    return true
  }

  const createCollection = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const title = readShareText(data.get('title'), shareTitleLimit)
    const ids = new Set(data.getAll('entry'))
    const selected = entries.filter(({ id }) => ids.has(id))
    if (!title || selected.length < 2 || selected.length > districtCollectionLimit) {
      setMessage(`Name your collection and choose 2–${districtCollectionLimit} notes.`)
      return
    }
    if (save({ id: crypto.randomUUID(), title, entries: selected })) form.reset()
  }

  const closePreview = () => navigate({ pathname: location.pathname, search: location.search, hash: '' }, { replace: true })

  return (
    <section aria-labelledby="district-collections-title" className="journal-panel">
      <h2 id="district-collections-title">District collections</h2>
      {hasLink && (
        <div className="journal-panel journal-panel--preview" ref={previewRef} tabIndex={-1}>
          <h3>{incoming?.title ?? 'Shared collection'}</h3>
          {incoming ? <CollectionNotes entries={incoming.entries} /> : <p role="status">This collection link is invalid or belongs to another district.</p>}
          <div className="outings__actions">
            {incoming && <ActionButton onClick={() => { if (save(incoming)) closePreview() }}>Save collection</ActionButton>}
            <ActionButton onClick={closePreview} variant="secondary">Close preview</ActionButton>
          </div>
        </div>
      )}
      {entries.length >= 2 ? (
        <details>
          <summary>Build a collection</summary>
          <form className="journal-form" onSubmit={createCollection}>
            <label className="journal-field">Collection title<input maxLength={shareTitleLimit} name="title" required /></label>
            <fieldset className="journal-choices">
              <legend>Choose 2–{districtCollectionLimit} notes</legend>
              {entries.map(({ id, note }) => (
                <label key={id}><input name="entry" type="checkbox" value={id} /><span>{note}</span></label>
              ))}
            </fieldset>
            <ActionButton type="submit">Create collection</ActionButton>
          </form>
        </details>
      ) : !collections.length && !hasLink && <p>Add two district notes to build a collection.</p>}
      {collections.map((collection) => (
        <article className="journal-panel" key={collection.id}>
          <h3>{collection.title}</h3>
          <CollectionNotes entries={collection.entries} />
          <details>
            <summary>Share collection</summary>
            <ShareLink label="Collection link" link={makeCollectionLink(districtId, collection)} />
          </details>
          {collection.entries.some(({ id }) => !entries.some((entry) => entry.id === id)) && (
            <ActionButton onClick={() => {
              const count = addNotes(collection.entries)
              if (count === false) setMessage('Could not add notes to this journal.')
              else setMessage(count ? `Notes added to your journal (${count}).` : 'These notes are already in your journal.')
            }} variant="secondary">Add notes to journal</ActionButton>
          )}
        </article>
      ))}
      {message && <p role="status">{message}</p>}
    </section>
  )
}
