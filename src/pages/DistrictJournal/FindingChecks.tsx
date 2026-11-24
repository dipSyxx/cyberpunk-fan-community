import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ActionButton } from '../../components/Button/Button'
import { ServerShareLink } from '../../components/ShareLink/ServerShareLink'
import type { FindingCheck, FindingObservation, JournalEntry, SharedFinding } from '../../../shared/community'
import { useCommunity, useResource } from '../../api/communityContext'
import { sharedToken } from '../../api/share'
import { useFeedbackAction } from '../../api/useFeedbackAction'
import { districtJournalPath, journalNoteLimit } from '../../data/districtJournal'
import { findingPlaceLimit, findingResults, readFindingResult, readSharedFinding } from '../../data/districtShares'
import { readInGameTime } from '../../data/outings'
import { readShareText } from '../../data/shareLinks'

function reportLabel(report: FindingObservation) {
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
  entries: JournalEntry[]
  checks: FindingCheck[]
}

export function FindingChecks({ districtId, entries, checks }: FindingChecksProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { site: { profile } } = useCommunity()
  const { message, setMessage, busy, save } = useFeedbackAction()
  const [reportingId, setReportingId] = useState<string | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const observationToken = sharedToken(location.hash, 'observation')
  const token = observationToken ?? sharedToken(location.hash, 'check')
  const kind = observationToken ? 'observation' : 'check'
  const hasLink = Boolean(token) || location.hash.startsWith('#finding=')
  const shared = useResource<SharedFinding>(token ? 'shared/' + kind : null, token)
  const incoming = token ? shared.value?.districtId === districtId ? shared.value : null
    : hasLink ? readSharedFinding(location.hash, districtId) : null
  const path = districtJournalPath(districtId)

  useEffect(() => {
    if (hasLink) previewRef.current?.focus()
  }, [hasLink, location.hash])

  async function saveIncoming(value: SharedFinding) {
    if (await save('save-finding', { districtId, ...(token ? { kind, token } : { legacy: value }) },
      value.report ? 'Observation saved.' : 'Finding check saved.')) closePreview()
  }

  const createRequest = async (event: FormEvent<HTMLFormElement>) => {
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
    if (await save('create-finding', { districtId, entryId: entry.id, place, time }, 'Finding check saved.')) form.reset()
  }

  const addObservation = async (event: FormEvent<HTMLFormElement>, check: FindingCheck) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const result = readFindingResult(data.get('result'))
    const time = readInGameTime(data.get('time'))
    const note = readShareText(data.get('note'))
    if (!result || !time || !note) {
      setMessage('Choose a time and result, then describe what you found.')
      return
    }
    if (await save('add-observation', { checkId: check.request.id, result, time, note }, 'Observation saved.')) setReportingId(null)
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
          ) : <p role="status">{shared.loading ? "Opening finding?" : shared.error?.message ?? "This finding link is invalid or belongs to another district."}</p>}
          <div className="outings__actions">
            {incoming && (profile ? <ActionButton disabled={busy} onClick={() => void saveIncoming(incoming)}>Save {incoming.report ? 'shared observation' : 'finding check'}</ActionButton> : <p>Log in to save this finding.</p>)}
            <ActionButton onClick={closePreview} variant="secondary">Close preview</ActionButton>
          </div>
        </div>
      )}
      {entries.length > 0 && (
        <details>
          <summary>Ask fans to check a find</summary>
          <form className="journal-form" onSubmit={(event) => void createRequest(event)}>
            <label className="journal-field">
              Journal note
              <select name="entry" required defaultValue="">
                <option disabled value="">Choose a note</option>
                {entries.map(({ id, note }) => <option key={id} value={id}>{note}</option>)}
              </select>
            </label>
            <label className="journal-field">Where to look<input maxLength={findingPlaceLimit} name="place" required /></label>
            <TimeField label="When you saw it" />
            <ActionButton disabled={busy} type="submit">Create finding check</ActionButton>
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
            <ServerShareLink label="Finding check link" path={path} name="check" action="share-check" data={{ id: check.request.id }} token={check.request.token} />
          </details>
          {check.reports.map((report) => (
            <div className="journal-panel" key={report.id}>
              <p><strong>{reportLabel(report)}</strong></p>
              <p>{report.note}</p>
              <details>
                <summary>Share observation</summary>
                <ServerShareLink label="Observation link" path={path} name="observation" action="share-observation" data={{ id: report.id }} token={report.token} />
              </details>
              {!entries.some(({ id }) => id === report.sourceId) && (
                <ActionButton disabled={busy} onClick={() => void save('copy-observation', { id: report.id }, 'Observation added to district notes.')} variant="secondary">Add observation to district notes</ActionButton>
              )}
            </div>
          ))}
          {reportingId === check.request.id ? (
            <form className="journal-form" onSubmit={(event) => void addObservation(event, check)}>
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
                <ActionButton disabled={busy} type="submit">Save observation</ActionButton>
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
