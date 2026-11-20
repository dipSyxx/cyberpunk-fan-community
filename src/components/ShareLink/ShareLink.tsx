import { useId, useRef, useState } from 'react'
import { ActionButton } from '../Button/Button'

export function ShareLink({ label, link }: { label: string; link: string }) {
  const id = useId()
  const field = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setMessage('Link copied.')
    } catch {
      field.current?.focus()
      field.current?.select()
      setMessage('Copy the selected link from the field.')
    }
  }

  return (
    <div className="journal-form">
      <label htmlFor={id}>{label}</label>
      <input id={id} onFocus={(event) => event.currentTarget.select()} readOnly ref={field} value={link} />
      <ActionButton onClick={copyLink} variant="secondary">Copy link</ActionButton>
      {message && <p role="status">{message}</p>}
    </div>
  )
}
