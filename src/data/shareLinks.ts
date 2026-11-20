export const shareTitleLimit = 60
export const shareTextLimit = 240

const uuidPattern = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i

export function readShareId(value: unknown) {
  return typeof value === 'string' && uuidPattern.test(value) ? value.toLowerCase() : null
}

export function readShareText(value: unknown, limit = shareTextLimit) {
  const text = typeof value === 'string' ? value.trim() : ''
  return text && text.length <= limit ? text : null
}

export function readShareObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
}

export function readShareJson(value: string | null): unknown {
  if (!value || value.length > 4096) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

export function shareParams(hash: string) {
  return new URLSearchParams(hash.length <= 16_384 ? hash.slice(1) : '')
}

export function makeShareLink(path: string, params: URLSearchParams) {
  const url = new URL(path, window.location.origin)
  url.hash = params.toString()
  return url.href
}
