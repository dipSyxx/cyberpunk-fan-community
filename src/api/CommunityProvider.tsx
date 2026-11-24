import { useCallback, useEffect, useRef, useState, type PropsWithChildren } from 'react'
import type { SiteData } from '../../shared/community'
import { ActionButton } from '../components/Button/Button'
import { ApiError, errorMessage, request } from './transport'
import { CommunityContext, type Change } from './communityContext'

export function CommunityProvider({ children }: PropsWithChildren) {
  const [site, setSite] = useState<SiteData | null>(null)
  const [failure, setFailure] = useState('')
  const [refreshError, setRefreshError] = useState('')
  const [version, setVersion] = useState(0)
  const requestNumber = useRef(0)
  const load = useCallback(async (signal?: AbortSignal) => {
    const number = ++requestNumber.current
    const snapshot = await request<SiteData>('site', undefined, signal)
    if (number === requestNumber.current) {
      setSite(snapshot)
      setFailure('')
      setRefreshError('')
    }
  }, [])

  const retry = useCallback((signal?: AbortSignal) => {
    void load(signal).catch((error: unknown) => {
      if (!signal?.aborted) setFailure(errorMessage(error))
    })
  }, [load])

  useEffect(() => {
    const controller = new AbortController()
    retry(controller.signal)
    return () => controller.abort()
  }, [retry])

  async function authenticate(action: 'login' | 'register' | 'logout', data: object = {}) {
    await request(`account/${action}`, data)
    try {
      await load()
      setVersion((value) => value + 1)
    } catch (error) {
      setSite(null)
      setFailure(errorMessage(error))
    }
  }

  async function mutate<T = object>(action: string, data: object, change: Change = 'detail') {
    if (!site?.profile) throw new ApiError(401, 'Sign in to make changes.')
    let result: T
    try {
      result = await request<T>(`actions/${action}`, data)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setSite(null)
        retry()
      }
      throw error
    }
    if (change === 'detail' || change === 'all') setVersion((value) => value + 1)
    if (change === 'site' || change === 'all') {
      await load().catch(() => setRefreshError('Your changes were saved. The page could not refresh.'))
    }
    return result
  }

  if (!site) {
    return <main className="figma-page">
      {failure
        ? <div className="journal-panel"><p role="alert">{failure}</p><ActionButton onClick={() => { setFailure(''); retry() }}>Retry</ActionButton></div>
        : <p role="status">Connecting to Night City…</p>}
    </main>
  }
  return (
    <CommunityContext.Provider value={{ site, version, authenticate, mutate }}>
      {refreshError && <div className="journal-panel"><p role="alert">{refreshError}</p><ActionButton onClick={() => void load().catch((error: unknown) => setRefreshError(errorMessage(error)))}>Refresh</ActionButton></div>}
      {children}
    </CommunityContext.Provider>
  )
}
