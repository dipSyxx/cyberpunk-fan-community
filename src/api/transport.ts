export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function request<T>(path: string, data?: object, signal?: AbortSignal): Promise<T> {
  let response: Response
  try {
    response = await fetch(`/api/${path}`, {
      method: data ? 'POST' : 'GET',
      credentials: 'same-origin',
      headers: data ? { 'Content-Type': 'application/json' } : undefined,
      body: data ? JSON.stringify(data) : undefined,
      signal,
    })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new ApiError(0, 'Could not reach the community server. Try again.')
  }
  if (!response.headers.get('Content-Type')?.startsWith('application/json')) {
    throw new ApiError(response.status, 'The community API is unavailable. Try again.')
  }
  const value: unknown = await response.json()
  if (!response.ok) {
    throw new ApiError(response.status, typeof value === 'object' && value !== null && 'error' in value && typeof value.error === 'string'
      ? value.error : 'Could not complete this action. Try again.')
  }
  return value as T
}

export function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : 'Could not complete this action. Try again.'
}
