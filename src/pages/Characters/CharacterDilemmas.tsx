import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ActionButton } from '../../components/Button/Button'
import { ServerShareLink } from '../../components/ShareLink/ServerShareLink'
import type { Argument, DilemmaJournal } from '../../../shared/community'
import { useCommunity, useResource } from '../../api/communityContext'
import { sharedToken } from '../../api/share'
import { useFeedbackAction } from '../../api/useFeedbackAction'
import { readDilemmaArgument } from '../../data/characterDilemmas'
import { readShareText, shareTextLimit } from '../../data/shareLinks'

function ArgumentText({ argument }: { argument: Argument }) {
  const [revealed, setRevealed] = useState(false)
  const textId = useId()
  return (
    <>
      {argument.spoiler && (
        <ActionButton aria-controls={textId} aria-expanded={revealed} onClick={() => setRevealed(!revealed)} variant="secondary">
          {revealed ? 'Hide story spoilers' : 'Reveal story spoilers'}
        </ActionButton>
      )}
      <div id={textId}>{(!argument.spoiler || revealed) && <p className="journal-text">{argument.text}</p>}</div>
    </>
  )
}

function Dilemma({ characterId, legacy, token, hasLink, closePreview }: {
  characterId: string
  legacy: Argument | null
  token?: string
  hasLink: boolean
  closePreview: () => void
}) {
  const { site: { profile } } = useCommunity()
  const detail = useResource<DilemmaJournal>(profile ? 'dilemma/' + characterId : null)
  const own = detail.value?.own
  const shared = useResource<Argument>(own && token ? 'shared/argument' : null, token)
  const incoming = own ? token ? shared.value?.characterId === characterId ? shared.value : null : legacy : null
  const [editing, setEditing] = useState(false)
  const { message, setMessage, busy, save } = useFeedbackAction()

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const text = readShareText(data.get('answer'))
    if (!text) {
      setMessage('Write a short response to the dilemma.')
      return
    }
    const spoiler = data.get('spoiler') === 'on'
    if (await save('dilemma-response', { characterId, text, spoiler }, 'Your response is saved.')) setEditing(false)
  }

  const keepArgument = async (argument: Argument) => {
    if (await save('save-argument', { characterId, ...(token ? { token } : { legacy: argument }) }, 'Shared response saved.')) closePreview()
  }

  if (!profile) return <p>Log in to write a response and open shared arguments.</p>
  if (detail.loading) return <p role="status">Loading responses?</p>
  if (detail.error) return <div role="alert">{detail.error.message} <button onClick={detail.retry} type="button">Retry</button></div>

  return (
    <>
      {!own || editing ? (
        <form className="journal-form" onSubmit={(event) => void submit(event)}>
          <label className="journal-field">
            Your argument
            <textarea defaultValue={own?.text} maxLength={shareTextLimit} name="answer" required rows={3} />
          </label>
          <label className="journal-check">
            <input defaultChecked={own?.spoiler} name="spoiler" type="checkbox" /> Contains story spoilers
          </label>
          <div className="outings__actions">
            <ActionButton disabled={busy} type="submit">Save my response</ActionButton>
            {editing && <ActionButton onClick={() => setEditing(false)} variant="secondary">Cancel</ActionButton>}
          </div>
        </form>
      ) : (
        <div className="journal-panel">
          <h3>Your response</h3>
          <p className="journal-text">{own.text}</p>
          {own.spoiler && <p>Marked as a story spoiler</p>}
          <ActionButton onClick={() => setEditing(true)} variant="secondary">Edit response</ActionButton>
          <details>
            <summary>Share your response</summary>
            <p>The link opens this version of your response.</p>
            <ServerShareLink key={own.id} label="Response link" path={'/characters?dilemma=' + encodeURIComponent(characterId)}
              name="argument" action="share-argument" data={{ characterId }} token={own.token} />
          </details>
        </div>
      )}
      {hasLink && (
        <div className="journal-panel" key={incoming?.id ?? 'preview'}>
          <h3>Shared argument</h3>
          {incoming ? <>
            <ArgumentText argument={incoming} />
            <ActionButton disabled={busy} onClick={() => void keepArgument(incoming)}>Save shared argument</ActionButton>
          </> : <p role="status">{!token && !legacy ? 'This shared argument link is invalid or incomplete.'
            : !own ? 'Save your own response to open this argument.'
            : shared.loading ? 'Opening argument?' : shared.error?.message ?? 'This argument belongs to another dilemma.'}</p>}
          <ActionButton onClick={closePreview} variant="secondary">Close shared argument</ActionButton>
        </div>
      )}
      {detail.value?.received.map((argument) => (
        <div className="journal-panel" key={argument.id}>
          <h3>Saved argument</h3>
          <ArgumentText argument={argument} />
        </div>
      ))}
      {message && <p role="status">{message}</p>}
    </>
  )
}

export function CharacterDilemmas() {
  const { site: { dilemmas } } = useCommunity()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const token = sharedToken(location.hash, 'argument')
  const hasLink = Boolean(token) || location.hash.startsWith('#argument=')
  const legacy = !token && hasLink ? readDilemmaArgument(location.hash, dilemmas) : null
  const selectedId = legacy?.characterId ?? searchParams.get('dilemma')
  const dilemma = dilemmas.find(({ id }) => id === selectedId) ?? dilemmas[0]

  useEffect(() => {
    if (hasLink || selectedId) headingRef.current?.focus()
  }, [hasLink, location.hash, selectedId])

  const dilemmaPath = (id: string, hash: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('dilemma', id)
    return { pathname: location.pathname, search: `?${params.toString()}`, hash }
  }
  if (!dilemma) return null
  const closePreview = () => navigate(dilemmaPath(dilemma.id, ''), { replace: true })

  return (
    <section aria-labelledby="character-dilemmas-title" className="journal-panel character-dilemmas">
      <h2 id="character-dilemmas-title" ref={headingRef} tabIndex={-1}>Character dilemmas</h2>
      <nav aria-label="Choose a character dilemma" className="outings__actions">
        {dilemmas.map(({ id, name }) => (
          <Link aria-current={dilemma.id === id ? 'true' : undefined} className="outings__journal-link" key={id} to={dilemmaPath(id, '#character-dilemmas-title')}>
            {name}
          </Link>
        ))}
      </nav>
      <h3>{dilemma.question}</h3>
      <Dilemma characterId={dilemma.id} legacy={legacy} token={token} hasLink={hasLink} closePreview={closePreview} key={dilemma.id} />
    </section>
  )
}
