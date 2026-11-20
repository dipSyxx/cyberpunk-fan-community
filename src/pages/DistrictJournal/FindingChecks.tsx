import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ActionButton } from '../../components/Button/Button'
import { ShareLink } from '../../components/ShareLink/ShareLink'
import { journalNoteLimit, type DistrictJournalEntry } from '../../data/districtJournal'
import {
  findingPlaceLimit, findingResults, makeFindingLink, readFindingResult, readSharedFinding, sameFinding,
  type FindingCheck, type FindingReport, type SharedFinding,
} from '../../data/districtShares'
import { readInGameTime } from '../../data/outings'
import { readShareText } from '../../data/shareLinks'
import { readStoredValue, writeStoredValue } from '../../hooks/useLocalStorage'

function reportLabel(report: FindingReport) {
  return `${report.time === 'day' ? 'Day' : 'Night'} · ${findingResults[report.result]}`
}

function TimeField({ label }: { label: string }) {
  return (
    <label className="journal-field">
      {label}
      <select name="time" required defaultValue="">
        <option disabled value="">Choose day or night</option>
        <option value="day">Day</option>
        <option value="night">Night</option>
      </select>
    </label>
  )
}

interface FindingChecksProps {
  districtId: string
  entries: DistrictJournalEntry[]
  addNotes: (entries: DistrictJournalEntry[]) => number | false
}

export function FindingChecks({ districtId, entries, addNotes }: FindingChecksProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const storageKey = `cyberpunk:finding-checks:${districtId}`
  const [checks, setChecks] = useState(() => readStoredValue<FindingCheck[]>(storageKey, []))
  const [message, setMessage] = useState('')
  const [reportingId, setReportingId] = useState<string | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const hasLink = location.hash.startsWith('#finding=')
  const incoming = hasLink ? readSharedFinding(location.hash, districtId) : null

  useEffect(() => {
    if (hasLink) previewRef.current?.focus()
  }, [hasLink, location.hash])

  const save = ({ request, report }: SharedFinding) => {
    const stored = readStoredValue(storageKey, checks)
    const existing = stored.find((check) => check.request.id === request.id)
    if (existing && !sameFinding(existing.request, request)) {
      setMessage('This link differs from the finding check already saved in this browser.')
      return false
    }

    if (existing && (!report || existing.reports.some(({ id }) => report.id === id))) {
      setChecks(stored)
      setMessage(report ? 'This observation is already saved.' : 'This finding check is already saved.')
      return true
    }

    const updated = { request, reports: report ? [report, ...(existing?.reports ?? [])] : [] }
    const next = existing
      ? stored.map((check) => check === existing ? updated : check)
      : [updated, ...stored]
    if (!writeStoredValue(storageKey, next)) {
      setMessage('Could not save the finding check in this browser.')
      return false
    }

    setChecks(next)
    setMessage(report ? 'Observation saved.' : 'Finding check saved.')
    return true
  }

  const createRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const entry = entries.find(({ id }) => id === data.get('entry'))
    const place = readShareText(data.get('place'), findingPlaceLimit)
    const time = readInGameTime(data.get('time'))
    if (!entry || !place || !time) {
      setMessage('Choose a note, describe the location, and choose day or night.')
      return
    }
    if (save({ request: { id: crypto.randomUUID(), note: entry.note, place, time } })) form.reset()
  }

  const addObservation = (event: FormEvent<HTMLFormElement>, check: FindingCheck) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const result = readFindingResult(data.get('result'))
    const time = readInGameTime(data.get('time'))
    const note = readShareText(data.get('note'))
    if (!result || !time || !note) {
      setMessage('Choose a time and result, then describe what you found.')
      return
    }
    const report = { id: crypto.randomUUID(), result, time, note, createdAt: new Date().toISOString() }
    if (save({ request: check.request, report })) setReportingId(null)
  }

  const closePreview = () => navigate({ pathname: location.pathname, search: location.search, hash: '' }, { replace: true })

  return (
    <section aria-labelledby="finding-checks-title" className="journal-panel">
      <h2 id="finding-checks-title">Finding checks</h2>
      {hasLink && (
        <div className="journal-panel journal-panel--preview" ref={previewRef} tabIndex={-1}>
          <h3>Shared finding check</h3>
          {incoming ? (
            <>
              <p><strong>{incoming.request.place}</strong> · Originally seen during the {incoming.request.time}</p>
              <p>{incoming.request.note}</p>
              {incoming.report && <p><strong>{reportLabel(incoming.report)}</strong><br />{incoming.report.note}</p>}
            </>
          ) : <p role="status">This finding link is invalid or belongs to another district.</p>}
          <div className="outings__actions">
            {incoming && <ActionButton onClick={() => { if (save(incoming)) closePreview() }}>Save {incoming.report ? 'shared observation' : 'finding check'}</ActionButton>}
            <ActionButton onClick={closePreview} variant="secondary">Close preview</ActionButton>
          </div>
        </div>
      )}
      {entries.length > 0 && (
        <details>
          <summary>Ask fans to check a find</summary>
          <form className="journal-form" onSubmit={createRequest}>
            <label className="journal-field">
              Journal note
              <select name="entry" required defaultValue="">
                <option disabled value="">Choose a note</option>
                {entries.map(({ id, note }) => <option key={id} value={id}>{note}</option>)}
              </select>
            </label>
            <label className="journal-field">Where to look<input maxLength={findingPlaceLimit} name="place" required /></label>
            <TimeField label="When you saw it" />
            <ActionButton type="submit">Create finding check</ActionButton>
          </form>
        </details>
      )}
      {checks.map((check) => (
        <article className="journal-panel journal-panel--preview" key={check.request.id}>
          <h3>{check.request.place}</h3>
          <p>Originally seen during the {check.request.time}</p>
          <p>{check.request.note}</p>
          <details>
            <summary>Share finding check</summary>
            <ShareLink label="Finding check link" link={makeFindingLink(districtId, check.request)} />
          </details>
          {check.reports.map((report) => (
            <div className="journal-panel" key={report.id}>
              <p><strong>{reportLabel(report)}</strong></p>
              <p>{report.note}</p>
              <details>
                <summary>Share observation</summary>
                <ShareLink label="Observation link" link={makeFindingLink(districtId, check.request, report)} />
              </details>
              {!entries.some(({ id }) => id === report.id) && (
                <ActionButton onClick={() => {
                  const count = addNotes([{ id: report.id, note: report.note, createdAt: report.createdAt }])
                  if (count === false) setMessage('Could not add the observation to district notes.')
                  else setMessage(count ? 'Observation added to district notes.' : 'This observation is already in district notes.')
                }} variant="secondary">Add observation to district notes</ActionButton>
              )}
            </div>
          ))}
          {reportingId === check.request.id ? (
            <form className="journal-form" onSubmit={(event) => addObservation(event, check)}>
              <TimeField label="When you checked" />
              <label className="journal-field">
                Result
                <select name="result" required defaultValue="">
                  <option disabled value="">Choose a result</option>
                  {Object.entries(findingResults).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="journal-field">What you noticed<textarea maxLength={journalNoteLimit} name="note" required rows={3} /></label>
              <div className="outings__actions">
                <ActionButton type="submit">Save observation</ActionButton>
                <ActionButton onClick={() => setReportingId(null)} variant="secondary">Cancel</ActionButton>
              </div>
            </form>
          ) : <ActionButton onClick={() => setReportingId(check.request.id)} variant="secondary">Add observation</ActionButton>}
        </article>
      ))}
      {entries.length === 0 && checks.length === 0 && !hasLink && <p>Add a district note to start a finding check.</p>}
      {message && <p role="status">{message}</p>}
    </section>
  )
}
