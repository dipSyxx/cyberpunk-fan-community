import type { FindingResult, InGameTime } from '../shared/community.ts'

export class HttpError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HttpError(400, 'Invalid request data.')
  return Object.fromEntries(Object.entries(value))
}

export function list(value: unknown, max: number): unknown[] {
  if (!Array.isArray(value) || value.length > max) throw new HttpError(400, 'Invalid or oversized list.')
  return value
}

export function field(value: unknown, max: number, name: string): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    throw new HttpError(400, `Enter ${name} using 1–${max} characters.`)
  }
  return value.trim()
}

export function boolean(value: unknown): boolean {
  if (typeof value !== 'boolean') throw new HttpError(400, 'Expected a true or false value.')
  return value
}

export function slug(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(value)) throw new HttpError(400, 'Invalid ID.')
  return value
}

export function uuid(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value)) {
    throw new HttpError(400, 'Invalid record ID.')
  }
  return value.toLowerCase()
}

export function capability(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{43}$/.test(value)) throw new HttpError(404, 'This share link is unavailable.')
  return value
}

export function date(value: unknown): Date {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
    throw new HttpError(400, 'Invalid date.')
  }
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.valueOf()) || parsed.toISOString() !== value || parsed.getUTCFullYear() < 1000) {
    throw new HttpError(400, 'Invalid date.')
  }
  return parsed
}

export function inGameTime(value: unknown): InGameTime {
  if (value !== 'day' && value !== 'night') throw new HttpError(400, 'Choose day or night.')
  return value
}

export function result(value: unknown): FindingResult {
  if (value !== 'confirmed' && value !== 'different' && value !== 'notFound') throw new HttpError(400, 'Choose a result.')
  return value
}
