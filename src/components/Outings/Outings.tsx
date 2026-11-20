import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { districts } from '../../data/districts'
import { districtJournalPath, journalNoteLimit } from '../../data/districtJournal'
import { readOutingClue } from '../../data/outingClues'
import { outings, type Outing } from '../../data/outings'
import { readStoredValue, writeStoredValue } from '../../hooks/useLocalStorage'
import { ActionButton } from '../Button/Button'
import { GlitchContent } from '../Button/GlitchContent'
import { ClueComposer } from './ClueComposer'

type InGameTime = 'day' | 'night'

interface OutingEntry {
  id: number
  outingId: string
  title: string
  district: string
  districtId?: string
  note: string
  completedAt: string
  inGameTime?: InGameTime
}

interface OutingJournal {
  activeOutingId: string | null
  activeClue?: Outing
  entries: OutingEntry[]
}

const storageKey = 'cyberpunk:outing-journal'
const emptyJournal: OutingJournal = { activeOutingId: null, entries: [] }
const districtNames = new Map(districts.map(({ id, name }) => [id, name]))
const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' })
const timeOptions = [
  { value: '', label: 'Unspecified' },
  { value: 'day', label: 'Day' },
  { value: 'night', label: 'Night' },
]

function parseInGameTime(value: FormDataEntryValue | null) {
  return value === 'day' || value === 'night' ? value : undefined
}

export function Outings({ savedDistrictIds }: { savedDistrictIds: string[] }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [journal, setJournal] = useState(() => readStoredValue(storageKey, emptyJournal))
  const [suggestedOutingId, setSuggestedOutingId] = useState<string | null>(null)
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [clueEntryId, setClueEntryId] = useState<number | null>(null)
  const [comparisonId, setComparisonId] = useState<string | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const noteRef = useRef<HTMLTextAreaElement>(null)
  const incomingClueRef = useRef<HTMLDivElement>(null)
  const comparisonRef = useRef<HTMLElement>(null)
  const unhandledClue = location.hash.startsWith('#clue=')
  const incomingClue = unhandledClue ? readOutingClue(location.hash) : null

  const completedOutingIds = new Set(journal.entries.map(({ outingId }) => outingId))
  const newOutings = outings.filter(({ id }) => !completedOutingIds.has(id))
  const savedOutings = newOutings.filter(({ districtId }) => savedDistrictIds.includes(districtId))
  const otherOutings = newOutings.filter(({ districtId }) => !savedDistrictIds.includes(districtId))
  const suggestions = [...savedOutings, ...otherOutings]
  const suggestionIndex = Math.max(0, suggestions.findIndex(({ id }) => id === suggestedOutingId))
  const activeOuting = journal.activeClue ?? outings.find(({ id }) => id === journal.activeOutingId)
  const displayedOuting = activeOuting ?? suggestions[suggestionIndex]
  const canRepeat = !activeOuting && newOutings.length === 0
  const latestEntryIds = new Map(journal.entries.toReversed().map(({ outingId, id }) => [outingId, id]))
  const comparisonEntries = journal.entries.filter(({ outingId }) => outingId === comparisonId)

  useEffect(() => {
    if (showNoteForm) noteRef.current?.focus()
  }, [showNoteForm])

  useEffect(() => {
    if (comparisonId) comparisonRef.current?.focus()
  }, [comparisonId])

  useEffect(() => {
    if (unhandledClue) incomingClueRef.current?.focus()
  }, [location.hash, unhandledClue])

  const saveJournal = (next: OutingJournal, message: string, focusHeading = true) => {
    if (!writeStoredValue(storageKey, next)) {
      setFeedback('Could not save this change in your browser. Try again.')
      return false
    }

    setJournal(next)
    setFeedback(message)
    if (focusHeading) headingRef.current?.focus()
    return true
  }

  const startOuting = (id: string, clue?: Outing) => {
    if (activeOuting) return

    if (saveJournal({ ...journal, activeOutingId: id, activeClue: clue }, 'Outing started.') && clue) {
      navigate({ pathname: location.pathname, search: location.search, hash: '' }, { replace: true })
    }
  }

  const saveNote = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!activeOuting) return

    const data = new FormData(event.currentTarget)
    const note = String(data.get('note') ?? '').trim()
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
      districtId: activeOuting.districtId,
      note,
      completedAt: new Date().toISOString(),
      inGameTime: parseInGameTime(data.get('inGameTime')),
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
        {unhandledClue && (
          <div className="journal-panel" ref={incomingClueRef} tabIndex={-1}>
            {incomingClue ? (
              <>
                <p className="outings__meta">Fan clue · {districtNames.get(incomingClue.districtId)}</p>
                <h4>{incomingClue.title}</h4>
                <p>{incomingClue.prompt}</p>
                {activeOuting ? (
                  <p>Finish your current outing to start this clue.</p>
                ) : (
                  <ActionButton onClick={() => startOuting(incomingClue.id, incomingClue)}>Start fan outing</ActionButton>
                )}
              </>
            ) : <p role="status">This fan clue link is invalid or incomplete.</p>}
          </div>
        )}
        {displayedOuting && (!incomingClue || activeOuting) && (
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
                    name="note"
                    maxLength={journalNoteLimit}
                    onChange={() => setFeedback('')}
                    ref={noteRef}
                    required
                    rows={3}
                  />
                  <label htmlFor="outing-time">In-game time</label>
                  <select id="outing-time" name="inGameTime">
                    {timeOptions.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                  </select>
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
        )}
        {!displayedOuting && !incomingClue && (
          <p>All outings completed. Choose one to repeat from your journal.</p>
        )}

        {journal.entries.length > 0 && (
          <a className="outings__journal-link" href="#outing-journal">
            <GlitchContent>Open outing journal</GlitchContent>
          </a>
        )}
        <p className="outings__feedback" role="status">{feedback}</p>
      </section>

      {journal.entries.length > 0 && (
        <section aria-labelledby="outing-journal-title" className="outing-journal" id="outing-journal" tabIndex={-1}>
          <h3 id="outing-journal-title">Outing journal</h3>
          {comparisonEntries.length > 0 && (
            <section aria-labelledby="outing-comparison-title" className="journal-panel" ref={comparisonRef} tabIndex={-1}>
              <h4 id="outing-comparison-title">Day and night · {comparisonEntries[0].title}</h4>
              <div className="outing-comparison">
                {(['day', 'night'] as const).map((time) => {
                  const entry = comparisonEntries.find(({ inGameTime }) => inGameTime === time)
                  return (
                    <div key={time}>
                      <h5>{time === 'day' ? 'Day' : 'Night'}</h5>
                      {entry ? (
                        <>
                          <time dateTime={entry.completedAt}>{dateFormatter.format(new Date(entry.completedAt))}</time>
                          <p>{entry.note}</p>
                        </>
                      ) : <p>Tag or add a {time === 'day' ? 'daytime' : 'nighttime'} note for this outing.</p>}
                    </div>
                  )
                })}
              </div>
              <ActionButton onClick={() => setComparisonId(null)} variant="secondary">Close comparison</ActionButton>
            </section>
          )}
          <ol>
            {journal.entries.map((entry) => {
              const districtId = entry.districtId ?? districts.find(({ name }) => name === entry.district)?.id
              return (
                <li key={entry.id}>
                  <div className="outings__meta">
                    {entry.district} · <time dateTime={entry.completedAt}>
                      {dateFormatter.format(new Date(entry.completedAt))}
                    </time>
                  </div>
                  <h4>{entry.title}</h4>
                  <p>{entry.note}</p>
                  <label className="outing-journal__time">
                    <span>In-game time</span>
                    <select
                      value={entry.inGameTime ?? ''}
                      onChange={(event) => {
                        const inGameTime = parseInGameTime(event.target.value)
                        saveJournal({
                          ...journal,
                          entries: journal.entries.map((item) => item.id === entry.id ? { ...item, inGameTime } : item),
                        }, 'In-game time saved.', false)
                      }}
                    >
                      {timeOptions.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                  <div className="outings__actions">
                    <ActionButton
                      aria-label={`Compare day and night: ${entry.title}`}
                      onClick={() => {
                        if (comparisonId === entry.outingId) comparisonRef.current?.focus()
                        else setComparisonId(entry.outingId)
                      }}
                      variant="secondary"
                    >
                      Compare day and night
                    </ActionButton>
                    {districtId && (
                      <>
                        <ActionButton onClick={() => setClueEntryId(entry.id)} variant="secondary">Create clue</ActionButton>
                        <Link className="outings__journal-link" to={districtJournalPath(districtId)} state={{ note: entry.note }}>
                          <GlitchContent>Add to district journal</GlitchContent>
                        </Link>
                      </>
                    )}
                    {canRepeat && outings.some(({ id }) => id === entry.outingId) && latestEntryIds.get(entry.outingId) === entry.id && (
                      <ActionButton
                        aria-label={`Repeat outing: ${entry.title}`}
                        onClick={() => startOuting(entry.outingId)}
                        variant="secondary"
                      >
                        Repeat outing
                      </ActionButton>
                    )}
                  </div>
                  {districtId && clueEntryId === entry.id && (
                    <ClueComposer districtId={districtId} sourceTitle={entry.title} onClose={() => setClueEntryId(null)} />
                  )}
                </li>
              )
            })}
          </ol>
        </section>
      )}
    </>
  )
}
