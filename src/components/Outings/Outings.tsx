import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { districts } from '../../data/districts'
import { districtJournalPath, journalNoteLimit } from '../../data/districtJournal'
import { readOutingClue, relayStopLimit, shareOutingClue } from '../../data/outingClues'
import { outings, readInGameTime, type InGameTime, type Outing } from '../../data/outings'
import { readStoredValue, writeStoredValue } from '../../hooks/useLocalStorage'
import { ActionButton } from '../Button/Button'
import { GlitchContent } from '../Button/GlitchContent'
import { ShareLink } from '../ShareLink/ShareLink'
import { ClueComposer } from './ClueComposer'

interface OutingEntry {
  id: number
  outingId: string
  title: string
  district: string
  districtId?: string
  note: string
  completedAt: string
  inGameTime?: InGameTime
  clue?: Outing
}

interface OutingJournal {
  activeOutingId: string | null
  activeClue?: Outing
  savedClues?: Outing[]
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

function RelayStops({ clue }: { clue: Outing }) {
  if (!clue.previousStops?.length) return null

  return (
    <div className="relay-stops">
      <strong>Previous stops</strong>
      <ol>
        {clue.previousStops.map(({ id, title, prompt }) => (
          <li key={id}><strong>{title}</strong><p>{prompt}</p></li>
        ))}
      </ol>
      <p>Stop {clue.previousStops.length + 1} of {relayStopLimit}</p>
    </div>
  )
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
  const incomingIsActive = incomingClue && incomingClue.id === activeOuting?.id
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

  const saveJournal = (update: (current: OutingJournal) => OutingJournal | null, message: string, focusHeading = true) => {
    const current = readStoredValue(storageKey, journal)
    const next = update(current)
    if (!next) {
      setJournal(current)
      setFeedback('Your outing changed in another tab. Review it and try again.')
      return false
    }
    if (!writeStoredValue(storageKey, next)) {
      setFeedback('Could not save this change in your browser. Try again.')
      return false
    }

    setJournal(next)
    setFeedback(message)
    if (focusHeading) headingRef.current?.focus()
    return true
  }

  const dismissIncomingClue = () => navigate({ pathname: location.pathname, search: location.search, hash: '' }, { replace: true })

  const startOuting = (id: string, clue?: Outing) => {
    if (activeOuting) return

    if (saveJournal((current) => current.activeOutingId ? null : {
      ...current,
      activeOutingId: id,
      activeClue: clue,
      savedClues: current.savedClues?.filter((saved) => saved.id !== id),
    }, 'Outing started.')) {
      setShowNoteForm(false)
      if (incomingClue?.id === id) dismissIncomingClue()
    }
  }

  const deferClue = (clue: Outing) => {
    if (saveJournal((current) => current.activeOutingId === clue.id ? null : ({
      ...current,
      savedClues: current.savedClues?.some(({ id }) => id === clue.id) ? current.savedClues : [...(current.savedClues ?? []), clue],
    }), 'Clue saved for later.')) dismissIncomingClue()
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

    if (saveJournal(
      (current) => {
        if (current.activeOutingId !== activeOuting.id) return null
        const entry: OutingEntry = {
          id: current.entries.length + 1,
          outingId: activeOuting.id,
          title: activeOuting.title,
          district: districtNames.get(activeOuting.districtId) ?? activeOuting.districtId,
          districtId: activeOuting.districtId,
          note,
          completedAt: new Date().toISOString(),
          inGameTime: readInGameTime(data.get('inGameTime')),
          clue: current.activeClue,
        }
        return { ...current, activeOutingId: null, activeClue: undefined, entries: [entry, ...current.entries] }
      },
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
                <RelayStops clue={incomingClue} />
                <h4>{incomingClue.title}</h4>
                <p>{incomingClue.prompt}</p>
                {activeOuting && <p>{incomingIsActive ? 'This clue is your current outing.' : 'Finish your current outing to start this clue.'}</p>}
                <div className="outings__actions">
                  {!activeOuting && <ActionButton onClick={() => startOuting(incomingClue.id, incomingClue)}>Start fan outing</ActionButton>}
                  {incomingIsActive ? (
                    <ActionButton onClick={dismissIncomingClue} variant="secondary">Close clue preview</ActionButton>
                  ) : (
                    <ActionButton onClick={() => deferClue(incomingClue)} variant="secondary">Save clue for later</ActionButton>
                  )}
                </div>
              </>
            ) : <p role="status">This fan clue link is invalid or incomplete.</p>}
          </div>
        )}
        {displayedOuting && (!incomingClue || activeOuting) && (
          <>
            <div aria-live="polite" className="outings__prompt">
              <p className="outings__meta">{districtNames.get(displayedOuting.districtId)}</p>
              {activeOuting && <RelayStops clue={activeOuting} />}
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

        {!!journal.savedClues?.length && (
          <section aria-labelledby="saved-clues-title" className="journal-panel">
            <h4 id="saved-clues-title">Saved fan clues</h4>
            {journal.savedClues.map((clue) => (
              <div className="journal-panel journal-panel--preview" key={clue.id}>
                <p className="outings__meta">{districtNames.get(clue.districtId)}</p>
                <strong>{clue.title}</strong>
                <RelayStops clue={clue} />
                <p>{clue.prompt}</p>
                <div className="outings__actions">
                  <ActionButton disabled={!!activeOuting} onClick={() => startOuting(clue.id, clue)}>Start saved clue</ActionButton>
                  <ActionButton onClick={() => saveJournal((current) => ({
                    ...current,
                    savedClues: current.savedClues?.filter(({ id }) => id !== clue.id),
                  }), 'Clue removed.')} variant="secondary">Remove saved clue</ActionButton>
                </div>
              </div>
            ))}
          </section>
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
              const previousStops = entry.clue ? [
                ...(entry.clue.previousStops ?? []),
                { id: entry.clue.id, title: entry.clue.title, prompt: entry.clue.prompt },
              ] : []
              const canContinueRelay = previousStops.length < relayStopLimit
              return (
                <li key={entry.id}>
                  <div className="outings__meta">
                    {entry.district} · <time dateTime={entry.completedAt}>
                      {dateFormatter.format(new Date(entry.completedAt))}
                    </time>
                  </div>
                  <h4>{entry.title}</h4>
                  <p>{entry.note}</p>
                  {entry.clue && (
                    <details className="journal-panel">
                      <summary>View and share this clue</summary>
                      <RelayStops clue={entry.clue} />
                      <p>{entry.clue.prompt}</p>
                      <ShareLink label="Clue link" link={shareOutingClue(entry.clue)} />
                    </details>
                  )}
                  <label className="outing-journal__time">
                    <span>In-game time</span>
                    <select
                      value={entry.inGameTime ?? ''}
                      onChange={(event) => {
                        const inGameTime = readInGameTime(event.target.value)
                        saveJournal((current) => ({
                          ...current,
                          entries: current.entries.map((item) => item.id === entry.id ? { ...item, inGameTime } : item),
                        }), 'In-game time saved.', false)
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
                        {canContinueRelay && (
                          <ActionButton onClick={() => setClueEntryId(entry.id)} variant="secondary">{entry.clue ? 'Add next stop' : 'Create clue'}</ActionButton>
                        )}
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
                  {entry.clue && !canContinueRelay && <p>This route has all {relayStopLimit} stops.</p>}
                  {districtId && canContinueRelay && clueEntryId === entry.id && (
                    <ClueComposer districtId={districtId} previousStops={previousStops} sourceTitle={entry.clue ? '' : entry.title} onClose={() => setClueEntryId(null)} />
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
