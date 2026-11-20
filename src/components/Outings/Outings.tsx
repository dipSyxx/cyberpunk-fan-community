import { useEffect, useRef, useState, type FormEvent } from 'react'
import { districts } from '../../data/districts'
import { outings } from '../../data/outings'
import { readStoredValue, writeStoredValue } from '../../hooks/useLocalStorage'
import { ActionButton } from '../Button/Button'

interface OutingEntry {
  id: number
  outingId: string
  title: string
  district: string
  note: string
  completedAt: string
}

interface OutingJournal {
  activeOutingId: string | null
  entries: OutingEntry[]
}

const storageKey = 'cyberpunk:outing-journal'
const emptyJournal: OutingJournal = { activeOutingId: null, entries: [] }
const districtNames = new Map(districts.map(({ id, name }) => [id, name]))
const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' })
const noteLimit = 240

export function Outings({ savedDistrictIds }: { savedDistrictIds: string[] }) {
  const [journal, setJournal] = useState(() => readStoredValue(storageKey, emptyJournal))
  const [suggestedOutingId, setSuggestedOutingId] = useState<string | null>(null)
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [feedback, setFeedback] = useState('')
  const headingRef = useRef<HTMLHeadingElement>(null)
  const noteRef = useRef<HTMLTextAreaElement>(null)

  const completedOutingIds = new Set(journal.entries.map(({ outingId }) => outingId))
  const newOutings = outings.filter(({ id }) => !completedOutingIds.has(id))
  const savedOutings = newOutings.filter(({ districtId }) => savedDistrictIds.includes(districtId))
  const otherOutings = newOutings.filter(({ districtId }) => !savedDistrictIds.includes(districtId))
  const suggestions = [...savedOutings, ...otherOutings]
  const suggestionIndex = Math.max(0, suggestions.findIndex(({ id }) => id === suggestedOutingId))
  const activeOuting = outings.find(({ id }) => id === journal.activeOutingId)
  const displayedOuting = activeOuting ?? suggestions[suggestionIndex]
  const canRepeat = !activeOuting && newOutings.length === 0
  const latestEntryIds = new Map(journal.entries.toReversed().map(({ outingId, id }) => [outingId, id]))

  useEffect(() => {
    if (showNoteForm) noteRef.current?.focus()
  }, [showNoteForm])

  const saveJournal = (next: OutingJournal, message: string) => {
    if (!writeStoredValue(storageKey, next)) {
      setFeedback('Could not save this change in your browser. Try again.')
      return false
    }

    setJournal(next)
    setFeedback(message)
    headingRef.current?.focus()
    return true
  }

  const startOuting = (id: string) => {
    if (activeOuting) return

    saveJournal({ ...journal, activeOutingId: id }, 'Outing started.')
  }

  const saveNote = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!activeOuting) return

    const note = noteRef.current?.value.trim()
    if (!note) {
      setFeedback('Write a short note about what you found.')
      noteRef.current?.focus()
      return
    }

    const entry: OutingEntry = {
      id: journal.entries.length + 1,
      outingId: activeOuting.id,
      title: activeOuting.title,
      district: districtNames.get(activeOuting.districtId) ?? activeOuting.districtId,
      note,
      completedAt: new Date().toISOString(),
    }
    if (saveJournal(
      { activeOutingId: null, entries: [entry, ...journal.entries] },
      'Note added to your outing journal.',
    )) {
      setShowNoteForm(false)
      setSuggestedOutingId(null)
    }
  }

  return (
    <>
      <section aria-labelledby="outings-title" className="outings">
        <h3 id="outings-title" ref={headingRef} tabIndex={-1}>Night City outings</h3>
        {displayedOuting ? (
          <>
            <div aria-live="polite" className="outings__prompt">
              <p className="outings__meta">{districtNames.get(displayedOuting.districtId)}</p>
              <h4>{displayedOuting.title}</h4>
              <p>{displayedOuting.prompt}</p>
            </div>
            {activeOuting ? (
              showNoteForm ? (
                <form className="outings__note-form" onSubmit={saveNote}>
                  <label htmlFor="outing-note">What did you find?</label>
                  <textarea
                    id="outing-note"
                    maxLength={noteLimit}
                    onChange={() => setFeedback('')}
                    ref={noteRef}
                    required
                    rows={3}
                  />
                  <ActionButton type="submit">Save note</ActionButton>
                </form>
              ) : (
                <ActionButton onClick={() => {
                  setFeedback('')
                  setShowNoteForm(true)
                }}>Add note</ActionButton>
              )
            ) : (
              <div className="outings__actions">
                <ActionButton onClick={() => startOuting(displayedOuting.id)}>Start outing</ActionButton>
                {suggestions.length > 1 && (
                  <ActionButton
                    onClick={() => {
                      setFeedback('')
                      setSuggestedOutingId(suggestions[(suggestionIndex + 1) % suggestions.length].id)
                    }}
                    variant="secondary"
                  >
                    Another outing
                  </ActionButton>
                )}
              </div>
            )}
          </>
        ) : (
          <p>All outings completed. Choose one to repeat from your journal.</p>
        )}

        {journal.entries.length > 0 && (
          <a className="outings__journal-link" href="#outing-journal">Open outing journal</a>
        )}
        <p className="outings__feedback" role="status">{feedback}</p>
      </section>

      {journal.entries.length > 0 && (
        <section aria-labelledby="outing-journal-title" className="outing-journal" id="outing-journal" tabIndex={-1}>
          <h3 id="outing-journal-title">Outing journal</h3>
          <ol>
            {journal.entries.map((entry) => (
              <li key={entry.id}>
                <div className="outings__meta">
                  {entry.district} · <time dateTime={entry.completedAt}>
                    {dateFormatter.format(new Date(entry.completedAt))}
                  </time>
                </div>
                <h4>{entry.title}</h4>
                <p>{entry.note}</p>
                {canRepeat && latestEntryIds.get(entry.outingId) === entry.id && (
                  <ActionButton
                    aria-label={`Repeat outing: ${entry.title}`}
                    onClick={() => startOuting(entry.outingId)}
                    variant="secondary"
                  >
                    Repeat outing
                  </ActionButton>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}
    </>
  )
}
