import { useCallback, useEffect, useRef, useState } from 'react'

export interface TransientStatus {
  id: number
  message: string
}

export function useTransientStatus(timeout = 3200) {
  const [status, setStatus] = useState<TransientStatus | null>(null)
  const timeoutRef = useRef<number | null>(null)
  const statusIdRef = useRef(0)

  const showStatus = useCallback(
    (message: string) => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }

      statusIdRef.current += 1
      setStatus({ id: statusIdRef.current, message })
      timeoutRef.current = window.setTimeout(() => {
        setStatus(null)
        timeoutRef.current = null
      }, timeout)
    },
    [timeout],
  )

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }
    },
    [],
  )

  return { status, showStatus }
}
