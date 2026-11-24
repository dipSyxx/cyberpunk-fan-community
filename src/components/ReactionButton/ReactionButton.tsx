import type { PollOption } from '../../../shared/community'
import { useCommunity } from '../../api/communityContext'
import { errorMessage } from '../../api/transport'
import { GlitchContent } from '../Button/GlitchContent'

export function ReactionButton({ option, onError }: { option: PollOption, onError: (message: string) => void }) {
  const { mutate } = useCommunity()
  const count = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(option.total)
  return (
    <button
      aria-label={`${option.label}. ${option.total.toLocaleString()} total`}
      aria-pressed={option.selected}
      className={`reaction-button${option.selected ? ' is-active' : ''}`}
      onClick={() => void mutate('vote', { id: option.id, selected: !option.selected }, 'site').catch((error: unknown) => onError(errorMessage(error)))}
      type="button"
    >
      <GlitchContent>
        <span aria-hidden="true">{option.symbol === 'star' ? '★' : '♥'}</span>
        <span>{option.label}</span>
        <strong>{count}</strong>
      </GlitchContent>
    </button>
  )
}
