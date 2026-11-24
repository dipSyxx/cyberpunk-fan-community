import type { InGameTime } from '../../shared/community'

export function readInGameTime(value: unknown): InGameTime | undefined {
  return value === 'day' || value === 'night' ? value : undefined
}
