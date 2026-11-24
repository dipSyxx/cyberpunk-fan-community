import { createContext, useContext, useEffect, useState } from 'react'
import type { SiteData } from '../../shared/community'
import { ApiError, errorMessage, request } from './transport'

export type Change = 'site' | 'detail' | 'all' | 'none'
type Context = {
  site: SiteData
  version: number
  authenticate: (action: 'login' | 'register' | 'logout', data?: object) => Promise<void>
  mutate: <T = object>(action: string, data: object, change?: Change) => Promise<T>
}

export const CommunityContext = createContext<Context | null>(null)

export function useCommunity() {
  const context = useContext(CommunityContext)
  if (!context) throw new Error('CommunityProvider is required')
  return context
}

type Resource<T> = { key: string, value?: T, error?: ApiError }

export function useResource<T>(path: string | null, token?: string) {
  const { version, site: { profile } } = useCommunity()
  const [retryCount, setRetryCount] = useState(0)
  const [result, setResult] = useState<Resource<T> | null>(null)
  const key = JSON.stringify([profile?.username, path, token])
  useEffect(() => {
    if (!path) return
    const controller = new AbortController()
    void request<T>(path, token === undefined ? undefined : { token }, controller.signal)
      .then((value) => { if (!controller.signal.aborted) setResult({ key, value }) })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setResult({ key, error: error instanceof ApiError ? error : new ApiError(0, errorMessage(error)) })
      })
    return () => controller.abort()
  }, [key, path, retryCount, token, version])
  const current = result?.key === key ? result : null
  return {
    value: current?.value,
    error: current?.error,
    loading: Boolean(path && !current),
    retry: () => setRetryCount((count) => count + 1),
  }
}
