import { useState, type FormEvent } from 'react'
import { clueHintLimit, clueTitleLimit, makeOutingClueLink } from '../../data/outingClues'
import type { OutingStop } from '../../data/outings'
import { ActionButton } from '../Button/Button'
import { ShareLink } from '../ShareLink/ShareLink'

interface ClueComposerProps {
  districtId: string
  sourceTitle: string
  previousStops: OutingStop[]
  onClose: () => void
}

export function ClueComposer({ districtId, sourceTitle, previousStops, onClose }: ClueComposerProps) {
  const [link, setLink] = useState('')
  const [message, setMessage] = useState('')

  const buildLink = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const title = String(data.get('title') ?? '').trim()
    const hint = String(data.get('hint') ?? '').trim()
    if (!title || !hint) {
      setMessage('Add a title and a hint.')
      return
    }

    setLink(makeOutingClueLink(districtId, title, hint, previousStops))
    setMessage('Your clue link is ready.')
  }

  return (
    <section aria-labelledby="fan-clue-form-title" className="journal-panel">
      <h4 id="fan-clue-form-title">{previousStops.length ? `Add stop ${previousStops.length + 1}` : 'Create a clue for a friend'}</h4>
      <p>{previousStops.length ? 'Your link shares the whole route, including your new stop.' : 'The link includes the district, title and hint you enter here.'}</p>
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
      {link && <ShareLink label={previousStops.length ? 'Shareable route link' : 'Shareable clue link'} link={link} />}
      <p role="status">{message}</p>
    </section>
  )
}
