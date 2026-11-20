import { useRef, useState, type FormEvent } from 'react'
import { clueHintLimit, clueTitleLimit, makeOutingClueLink } from '../../data/outingClues'
import { ActionButton } from '../Button/Button'

interface ClueComposerProps {
  districtId: string
  sourceTitle: string
  onClose: () => void
}

export function ClueComposer({ districtId, sourceTitle, onClose }: ClueComposerProps) {
  const [link, setLink] = useState('')
  const [message, setMessage] = useState('')
  const linkRef = useRef<HTMLInputElement>(null)

  const buildLink = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const title = String(data.get('title') ?? '').trim()
    const hint = String(data.get('hint') ?? '').trim()
    if (!title || !hint) {
      setMessage('Add a title and a hint.')
      return
    }

    setLink(makeOutingClueLink(districtId, title, hint))
    setMessage('Your clue link is ready.')
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setMessage('Clue link copied.')
    } catch {
      linkRef.current?.select()
      setMessage('Select and copy the link from the field.')
    }
  }

  return (
    <section aria-labelledby="fan-clue-form-title" className="journal-panel">
      <h4 id="fan-clue-form-title">Create a clue for a friend</h4>
      <p>The link includes the district, title and hint you enter here.</p>
      <form
        className="journal-form"
        onChange={() => {
          setLink('')
          setMessage('')
        }}
        onSubmit={buildLink}
      >
        <label htmlFor="fan-clue-title">Clue title</label>
        <input id="fan-clue-title" name="title" defaultValue={sourceTitle.slice(0, clueTitleLimit)} maxLength={clueTitleLimit} required />
        <label htmlFor="fan-clue-hint">Hint</label>
        <textarea id="fan-clue-hint" name="hint" maxLength={clueHintLimit} rows={3} required />
        <div className="outings__actions">
          <ActionButton type="submit">Create clue link</ActionButton>
          <ActionButton onClick={onClose} variant="secondary">Close</ActionButton>
        </div>
      </form>
      {link && (
        <div className="journal-form">
          <label htmlFor="fan-clue-link">Shareable clue link</label>
          <input id="fan-clue-link" ref={linkRef} value={link} readOnly />
          <ActionButton onClick={copyLink} variant="secondary">Copy clue link</ActionButton>
        </div>
      )}
      <p role="status">{message}</p>
    </section>
  )
}
