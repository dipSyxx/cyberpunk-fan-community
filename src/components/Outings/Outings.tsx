import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { Outing, OutingsData } from '../../../shared/community'
import { useCommunity, useResource } from '../../api/communityContext'
import { errorMessage } from '../../api/transport'
import { sharedToken } from '../../api/share'
import { districtJournalPath, journalNoteLimit } from '../../data/districtJournal'
import { readOutingClue, relayStopLimit } from '../../data/outingClues'
import { readInGameTime } from '../../data/outings'
import { ActionButton } from '../Button/Button'
import { GlitchContent } from '../Button/GlitchContent'
import { ServerShareLink } from '../ShareLink/ServerShareLink'
import { ClueComposer } from './ClueComposer'

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
  const { site: { profile, districts, outings }, mutate } = useCommunity()
  const resource = useResource<OutingsData>(profile ? 'outings' : null)
  const districtNames = new Map(districts.map(({ id, name }) => [id, name]))
  const activeRun = resource.value?.active ?? null
  const journal = {
    savedClues: resource.value?.savedClues ?? [],
    entries: resource.value?.entries.flatMap((run) => run.completedAt && run.note ? [{
      id: run.id, outingId: run.outing.id, title: run.outing.title, districtId: run.outing.districtId,
      district: districtNames.get(run.outing.districtId), completedAt: run.completedAt, note: run.note, inGameTime: run.inGameTime,
      clue: outings.some(({ id }) => id === run.outing.id) ? null : run.outing,
    }] : []) ?? [],
  }
  const [saving, setSaving] = useState(false)
  const [suggestedOutingId, setSuggestedOutingId] = useState<string | null>(null)
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [clueEntryId, setClueEntryId] = useState<string | null>(null)
  const [comparisonId, setComparisonId] = useState<string | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const noteRef = useRef<HTMLTextAreaElement>(null)
  const incomingClueRef = useRef<HTMLDivElement>(null)
  const comparisonRef = useRef<HTMLElement>(null)
  const token = sharedToken(location.hash, 'clue')
  const unhandledClue = Boolean(token) || location.hash.startsWith('#clue=')
  const incoming = useResource<Outing>(token ? 'shared/clue' : null, token)
  const incomingClue = token ? incoming.value : unhandledClue ? readOutingClue(location.hash, districts) : null

  const completedOutingIds = new Set(journal.entries.map(({ outingId }) => outingId))
  const newOutings = outings.filter(({ id }) => !completedOutingIds.has(id))
  const savedOutings = newOutings.filter(({ districtId }) => savedDistrictIds.includes(districtId))
  const otherOutings = newOutings.filter(({ districtId }) => !savedDistrictIds.includes(districtId))
  const suggestions = [...savedOutings, ...otherOutings]
  const suggestionIndex = Math.max(0, suggestions.findIndex(({ id }) => id === suggestedOutingId))
  const activeOuting = activeRun?.outing
  const incomingIsActive = incomingClue && incomingClue.id === activeOuting?.id
  const displayedOuting = resource.loading || resource.error ? undefined : activeOuting ?? suggestions[suggestionIndex]
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

  const dismissIncomingClue = () => navigate({ pathname: location.pathname, search: location.search, hash: '' }, { replace: true })

  async function save(action: string, data: object, message: string, focusHeading = true) {
    if (saving) return false
    setSaving(true)
    try {
      await mutate(action, data)
      setFeedback(message)
      if (focusHeading) headingRef.current?.focus()
      return true
    } catch (error) {
      setFeedback(errorMessage(error))
      return false
    } finally {
      setSaving(false)
    }
  }

  function clueInput(clue: Outing, fromLink: boolean) {
    if (clue.token) return { token: clue.token }
    return fromLink ? { legacy: clue } : { clueId: clue.id }
  }

  async function startOuting(id: string, clue?: Outing, fromLink = false) {
    if (activeOuting) return
    if (await save('start-outing', clue ? clueInput(clue, fromLink) : { templateId: id }, 'Outing started.')) {
      setShowNoteForm(false)
      if (fromLink) dismissIncomingClue()
    }
  }

  async function deferClue(clue: Outing) {
    if (await save('save-clue', clueInput(clue, true), 'Clue saved for later.')) dismissIncomingClue()
  }

  async function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!activeRun) return
    const data = new FormData(event.currentTarget)
    const note = String(data.get('note') ?? '').trim()
    if (!note) {
      setFeedback('Write a short note about what you found.')
      noteRef.current?.focus()
      return
    }
    if (await save('complete-outing', { id: activeRun.id, note, time: readInGameTime(data.get('inGameTime')) }, 'Note added to your outing journal.')) {
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
                  {!activeOuting && <ActionButton disabled={saving} onClick={() => void startOuting(incomingClue.id, incomingClue, true)}>Start fan outing</ActionButton>}
                  {incomingIsActive ? (
                    <ActionButton onClick={dismissIncomingClue} variant="secondary">Close clue preview</ActionButton>
                  ) : (
                    <ActionButton disabled={saving} onClick={() => void deferClue(incomingClue)} variant="secondary">Save clue for later</ActionButton>
                  )}
                </div>
              </>
            ) : <p role="status">{incoming.loading ? "Opening clue?" : incoming.error?.message ?? "This fan clue link is invalid or incomplete."}</p>}
          </div>
        )}
        {resource.loading && <p role="status">Loading outings?</p>}
        {resource.error && <div role="alert">{resource.error.message} <button type="button" onClick={resource.retry}>Retry</button></div>}
        {!profile && <p>Log in to start outings and save clues.</p>}
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
                <form className="outings__note-form" onSubmit={(event) => void saveNote(event)}>
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
                  <ActionButton disabled={saving} type="submit">Save note</ActionButton>
                </form>
              ) : (
                <ActionButton onClick={() => {
                  setFeedback('')
                  setShowNoteForm(true)
                }}>Add note</ActionButton>
              )
            ) : (
              <div className="outings__actions">
                <ActionButton disabled={saving} onClick={() => void startOuting(displayedOuting.id)}>Start outing</ActionButton>
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
        {canRepeat && !resource.loading && !resource.error && !displayedOuting && !incomingClue && (
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
                  <ActionButton disabled={!!activeOuting || saving} onClick={() => void startOuting(clue.id, clue)}>Start saved clue</ActionButton>
                  <ActionButton disabled={saving} onClick={() => void save('remove-clue', { id: clue.id }, 'Clue removed.')} variant="secondary">Remove saved clue</ActionButton>
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
              const districtId = entry.districtId
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
                      <ServerShareLink label="Clue link" path="/" name="clue" action="share-clue" data={{ id: entry.clue.id }} token={entry.clue.token} />
                    </details>
                  )}
                  <label className="outing-journal__time">
                    <span>In-game time</span>
                    <select
                      value={entry.inGameTime ?? ''}
                      onChange={(event) => {
                        const inGameTime = readInGameTime(event.target.value)
                        void save('label-outing', { id: entry.id, time: inGameTime }, 'In-game time saved.', false)
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
                        disabled={saving} onClick={() => void startOuting(entry.outingId)}
                        variant="secondary"
                      >
                        Repeat outing
                      </ActionButton>
                    )}
                  </div>
                  {entry.clue && !canContinueRelay && <p>This route has all {relayStopLimit} stops.</p>}
                  {districtId && canContinueRelay && clueEntryId === entry.id && (
                    <ClueComposer runId={entry.id} stopCount={previousStops.length} sourceTitle={entry.clue ? '' : entry.title} onClose={() => setClueEntryId(null)} />
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
