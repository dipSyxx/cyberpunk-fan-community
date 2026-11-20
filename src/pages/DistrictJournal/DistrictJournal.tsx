import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { ActionButton } from '../../components/Button/Button'
import { GlitchContent } from '../../components/Button/GlitchContent'
import { exportDistrictEntry, journalNoteLimit, readDistrictEntry, type DistrictJournalEntry } from '../../data/districtJournal'
import { districts, type District } from '../../data/districts'
import { readStoredValue, writeStoredValue } from '../../hooks/useLocalStorage'
import { DistrictCollections } from './DistrictCollections'
import { FindingChecks } from './FindingChecks'

const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' })

export function DistrictJournal() {
  const { districtId } = useParams()
  const district = districts.find(({ id }) => id === districtId)
  return district ? <Journal key={district.id} district={district} /> : <Navigate to="/night-city" replace />
}

function Journal({ district }: { district: District }) {
  const { state } = useLocation()
  const storageKey = `cyberpunk:district-journal:${district.id}`
  const [entries, setEntries] = useState(() => readStoredValue<DistrictJournalEntry[]>(storageKey, []))
  const [draft, setDraft] = useState(() =>
    typeof state?.note === 'string' ? state.note.slice(0, journalNoteLimit) : '',
  )
  const [preview, setPreview] = useState<DistrictJournalEntry | null>(null)
  const [message, setMessage] = useState('')
  const [reading, setReading] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const appendNotes = (incoming: DistrictJournalEntry[]) => {
    const stored = readStoredValue(storageKey, entries)
    const newEntries = incoming.filter(({ id }) => !stored.some((entry) => entry.id === id))
    const next = [...newEntries, ...stored]
    if (newEntries.length && !writeStoredValue(storageKey, next)) return false
    setEntries(next)
    return newEntries.length
  }

  const save = (entry: DistrictJournalEntry) => {
    const count = appendNotes([entry])
    if (count === false) {
      setMessage('Could not save the journal in this browser. Try again.')
      return false
    }
    if (count === 0) {
      setMessage('This note is already in your district journal.')
      return false
    }

    setMessage('Note added to the district journal.')
    return true
  }

  const importNotes = (notes: DistrictJournalEntry[]) => appendNotes(notes.map((note) => ({ ...note, imported: true })))

  const addNote = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const note = draft.trim()
    if (!note || note.length > journalNoteLimit) {
      setMessage(`Write a note of up to ${journalNoteLimit} characters.`)
      return
    }

    if (save({ id: crypto.randomUUID(), note, createdAt: new Date().toISOString() })) setDraft('')
  }

  const loadFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (!file) return

    setPreview(null)
    setMessage('')
    if (file.size > 4096) {
      setMessage('That file is too large for a district note.')
      return
    }

    setReading(true)
    try {
      const data: unknown = JSON.parse(await file.text())
      const entry = readDistrictEntry(data, district.id)
      if (!entry) {
        setMessage(`Choose a valid note file for ${district.name}.`)
      } else if (entries.some(({ id }) => id === entry.id)) {
        setMessage('This note is already in your district journal.')
      } else {
        setPreview(entry)
        setMessage('Review the imported note before adding it.')
      }
    } catch {
      setMessage('Could not read that note file.')
    } finally {
      setReading(false)
    }
  }

  const download = (entry: DistrictJournalEntry) => {
    const objectUrl = URL.createObjectURL(exportDistrictEntry(district.id, entry))
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = `${district.id}-${entry.id}.json`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
  }

  return (
    <div className="figma-page district-journal-page">
      <header className="page-title">
        <h1 className="glitch-heading glitch-heading--yellow">{district.name} journal</h1>
        <p>Keep local finds, or exchange individual note files with friends.</p>
        <Link className="outings__journal-link" to="/night-city"><GlitchContent>Back to districts</GlitchContent></Link>
      </header>

      <div className="district-journal-layout">
        <section aria-labelledby="district-notes-title" className="outing-journal">
          <h2 id="district-notes-title">District notes</h2>
          {entries.length > 0 ? (
            <ol>
              {entries.map((entry) => (
                <li key={entry.id}>
                  <p className="outings__meta">
                    {entry.imported ? 'Imported' : 'Your note'} · <time dateTime={entry.createdAt}>
                      {dateFormatter.format(new Date(entry.createdAt))}
                    </time>
                  </p>
                  <p>{entry.note}</p>
                  <ActionButton onClick={() => download(entry)} variant="secondary">Export note</ActionButton>
                </li>
              ))}
            </ol>
          ) : <p>No notes in this district yet.</p>}
        </section>

        <div className="district-journal-tools">
          <section aria-labelledby="district-add-title" className="journal-panel">
            <h2 id="district-add-title">Add a find</h2>
            <form className="journal-form" onSubmit={addNote}>
              <label htmlFor="district-note">Your finding</label>
              <textarea
                id="district-note"
                maxLength={journalNoteLimit}
                onChange={(event) => setDraft(event.target.value)}
                required
                rows={4}
                value={draft}
              />
              <ActionButton type="submit">Add to journal</ActionButton>
            </form>
          </section>

          <section aria-labelledby="district-import-title" className="journal-panel">
            <h2 id="district-import-title">Import a friend’s note</h2>
            <input accept=".json,application/json" aria-label="District note file" hidden onChange={loadFile} ref={fileInput} type="file" />
            <ActionButton disabled={reading} onClick={() => fileInput.current?.click()} variant="secondary">Choose note file</ActionButton>
            {preview && (
              <div className="journal-panel journal-panel--preview">
                <h3>Import preview</h3>
                <p>{preview.note}</p>
                <div className="outings__actions">
                  <ActionButton onClick={() => {
                    if (save(preview)) setPreview(null)
                  }}>Add imported note</ActionButton>
                  <ActionButton onClick={() => {
                    setPreview(null)
                    setMessage('Import discarded.')
                  }} variant="secondary">Discard</ActionButton>
                </div>
              </div>
            )}
          </section>
          <p className="district-journal-status" role="status">{message}</p>
          <FindingChecks addNotes={importNotes} districtId={district.id} entries={entries} />
          <DistrictCollections addNotes={importNotes} districtId={district.id} entries={entries} />
        </div>
      </div>
    </div>
  )
}
