import { useState } from 'react'
import { useCommunity } from '../../api/communityContext'
import { errorMessage } from '../../api/transport'
import { shareUrl } from '../../api/share'
import { ActionButton } from '../Button/Button'
import { ShareLink } from './ShareLink'

interface ShareProps {
  label: string
  path: string
  name: string
  token?: string
  action: string
  data: object
}

export function ServerShareLink({ label, path, name, token, action, data }: ShareProps) {
  const { mutate } = useCommunity()
  const [createdToken, setCreatedToken] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const available = token || createdToken
  if (available) return <ShareLink label={label} link={shareUrl(path, name, available)} />

  async function create() {
    setBusy(true)
    setMessage('')
    try {
      const result = await mutate<{ token: string }>(action, data, 'none')
      setCreatedToken(result.token)
    } catch (error) {
      setMessage(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  return <>
    <ActionButton disabled={busy} onClick={() => void create()} variant="secondary">{busy ? 'Creating link…' : `Create ${label.toLowerCase()}`}</ActionButton>
    {message && <p role="alert">{message}</p>}
  </>
}
