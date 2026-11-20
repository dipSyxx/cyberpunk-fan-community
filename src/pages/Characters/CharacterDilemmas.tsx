import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ActionButton } from '../../components/Button/Button'
import { ShareLink } from '../../components/ShareLink/ShareLink'
import { characterDilemmas, makeArgumentLink, readDilemmaArgument, type DilemmaArgument } from '../../data/characterDilemmas'
import { readShareText, shareTextLimit } from '../../data/shareLinks'
import { readStoredValue, writeStoredValue } from '../../hooks/useLocalStorage'

interface DilemmaJournal {
  own?: DilemmaArgument
  received: DilemmaArgument[]
}

function ArgumentText({ argument }: { argument: DilemmaArgument }) {
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

function Dilemma({ characterId, incoming, closePreview }: {
  characterId: string
  incoming: DilemmaArgument | null
  closePreview: () => void
}) {
  const storageKey = `cyberpunk:character-dilemma:${characterId}`
  const [journal, setJournal] = useState(() => readStoredValue<DilemmaJournal>(storageKey, { received: [] }))
  const [editing, setEditing] = useState(false)
  const [message, setMessage] = useState('')

  const save = (next: DilemmaJournal, feedback: string) => {
    if (!writeStoredValue(storageKey, next)) {
      setMessage('Could not save the dilemma response in this browser.')
      return false
    }
    setJournal(next)
    setMessage(feedback)
    return true
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const text = readShareText(data.get('answer'))
    if (!text) {
      setMessage('Write a short response to the dilemma.')
      return
    }
    const stored = readStoredValue(storageKey, journal)
    const spoiler = data.get('spoiler') === 'on'
    const own = stored.own?.text === text && stored.own.spoiler === spoiler
      ? stored.own : { id: crypto.randomUUID(), characterId, text, spoiler }
    if (save({ ...stored, own }, 'Your response is saved.')) setEditing(false)
  }

  const keepArgument = (argument: DilemmaArgument) => {
    const stored = readStoredValue(storageKey, journal)
    if (stored.own?.id === argument.id || stored.received.some(({ id }) => id === argument.id)) {
      setJournal(stored)
      setMessage('This response is already saved.')
      closePreview()
    } else if (save({ ...stored, received: [argument, ...stored.received] }, 'Shared response saved.')) {
      closePreview()
    }
  }

  return (
    <>
      {!journal.own || editing ? (
        <form className="journal-form" onSubmit={submit}>
          <label className="journal-field">
            Your argument
            <textarea defaultValue={journal.own?.text} maxLength={shareTextLimit} name="answer" required rows={3} />
          </label>
          <label className="journal-check">
            <input defaultChecked={journal.own?.spoiler} name="spoiler" type="checkbox" /> Contains story spoilers
          </label>
          <div className="outings__actions">
            <ActionButton type="submit">Save my response</ActionButton>
            {editing && <ActionButton onClick={() => setEditing(false)} variant="secondary">Cancel</ActionButton>}
          </div>
        </form>
      ) : (
        <div className="journal-panel">
          <h3>Your response</h3>
          <p className="journal-text">{journal.own.text}</p>
          {journal.own.spoiler && <p>Marked as a story spoiler</p>}
          <ActionButton onClick={() => setEditing(true)} variant="secondary">Edit response</ActionButton>
          <details>
            <summary>Share your response</summary>
            <p>The link contains the response you wrote.</p>
            <ShareLink label="Response link" link={makeArgumentLink(journal.own)} />
          </details>
        </div>
      )}
      {incoming && (
        <div className="journal-panel" key={incoming.id}>
          <h3>Shared argument</h3>
          {journal.own ? (
            <>
              <ArgumentText argument={incoming} />
              <ActionButton onClick={() => keepArgument(incoming)}>Save shared argument</ActionButton>
            </>
          ) : <p>Save your own response to open this argument.</p>}
          <ActionButton onClick={closePreview} variant="secondary">Close shared argument</ActionButton>
        </div>
      )}
      {journal.received.map((argument) => (
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
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const hasLink = location.hash.startsWith('#argument=')
  const incoming = hasLink ? readDilemmaArgument(location.hash) : null
  const selectedId = incoming?.characterId ?? searchParams.get('dilemma')
  const dilemma = characterDilemmas.find(({ id }) => id === selectedId) ?? characterDilemmas[0]

  useEffect(() => {
    if (hasLink || selectedId) headingRef.current?.focus()
  }, [hasLink, location.hash, selectedId])

  const dilemmaPath = (id: string, hash: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('dilemma', id)
    return { pathname: location.pathname, search: `?${params.toString()}`, hash }
  }
  const closePreview = () => navigate(dilemmaPath(dilemma.id, ''), { replace: true })

  return (
    <section aria-labelledby="character-dilemmas-title" className="journal-panel character-dilemmas">
      <h2 id="character-dilemmas-title" ref={headingRef} tabIndex={-1}>Character dilemmas</h2>
      <nav aria-label="Choose a character dilemma" className="outings__actions">
        {characterDilemmas.map(({ id, name }) => (
          <Link aria-current={dilemma.id === id ? 'true' : undefined} className="outings__journal-link" key={id} to={dilemmaPath(id, '#character-dilemmas-title')}>
            {name}
          </Link>
        ))}
      </nav>
      <h3>{dilemma.question}</h3>
      {hasLink && !incoming && (
        <div className="journal-panel">
          <p role="status">This shared argument link is invalid or incomplete.</p>
          <ActionButton onClick={closePreview} variant="secondary">Close preview</ActionButton>
        </div>
      )}
      <Dilemma characterId={dilemma.id} incoming={incoming} closePreview={closePreview} key={dilemma.id} />
    </section>
  )
}
