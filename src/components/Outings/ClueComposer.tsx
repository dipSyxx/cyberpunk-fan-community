import { useState, type FormEvent } from 'react'
import { useCommunity } from '../../api/communityContext'
import { errorMessage } from '../../api/transport'
import { shareUrl } from '../../api/share'
import { clueHintLimit, clueTitleLimit } from '../../data/outingClues'
import { ActionButton } from '../Button/Button'
import { ShareLink } from '../ShareLink/ShareLink'

interface ClueComposerProps {
  runId: string
  sourceTitle: string
  stopCount: number
  onClose: () => void
}

export function ClueComposer({ runId, sourceTitle, stopCount, onClose }: ClueComposerProps) {
  const { mutate } = useCommunity()
  const [link, setLink] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const buildLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    const data = new FormData(event.currentTarget)
    const title = String(data.get('title') ?? '').trim()
    const hint = String(data.get('hint') ?? '').trim()
    if (!title || !hint) {
      setMessage('Add a title and a hint.')
      return
    }

    setBusy(true)
    try {
      const { token } = await mutate<{ token: string }>('create-clue', { runId, title, hint }, 'none')
      setLink(shareUrl('/', 'clue', token))
      setMessage('Your clue link is ready.')
    } catch (error) {
      setMessage(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-labelledby="fan-clue-form-title" className="journal-panel">
      <h4 id="fan-clue-form-title">{stopCount ? `Add stop ${stopCount + 1}` : 'Create a clue for a friend'}</h4>
      <p>{stopCount ? 'Your link shares the whole route, including your new stop.' : 'The link includes the district, title and hint you enter here.'}</p>
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
          <ActionButton disabled={busy} type="submit">Create clue link</ActionButton>
          <ActionButton onClick={onClose} variant="secondary">Close</ActionButton>
        </div>
      </form>
      {link && <ShareLink label={stopCount ? 'Shareable route link' : 'Shareable clue link'} link={link} />}
      <p role="status">{message}</p>
    </section>
  )
}
