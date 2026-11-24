import { useState } from 'react'
import { useCommunity } from './communityContext'
import { errorMessage } from './transport'

export function useFeedbackAction() {
  const { mutate } = useCommunity()
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function save(action: string, data: object, feedback: string) {
    if (busy) return false
    setBusy(true)
    setMessage('')
    try {
      await mutate(action, data)
      setMessage(feedback)
      return true
    } catch (error) {
      setMessage(errorMessage(error))
      return false
    } finally {
      setBusy(false)
    }
  }

  return { save, busy, message, setMessage }
}
