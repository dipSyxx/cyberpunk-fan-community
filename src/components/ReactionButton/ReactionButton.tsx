import { useLocalStorage } from '../../hooks/useLocalStorage'

interface ReactionButtonProps {
  storageKey: string
  initialCount: number
  label: string
  activeLabel: string
  symbol?: string
  compactCount?: boolean
  className?: string
}

export function ReactionButton({
  storageKey,
  initialCount,
  label,
  activeLabel,
  symbol = '♥',
  compactCount = false,
  className = '',
}: ReactionButtonProps) {
  const [active, setActive] = useLocalStorage(
    `cyberpunk:reaction:${storageKey}`,
    false,
  )
  const currentLabel = active ? activeLabel : label
  const count = initialCount + Number(active)
  const formattedCount = compactCount
    ? `${new Intl.NumberFormat('en', {
        notation: 'compact',
        maximumFractionDigits: 1,
      })
        .format(initialCount)
        .toUpperCase()}${active ? '+1' : ''}`
    : count.toLocaleString('en')

  return (
    <button
      aria-label={`${currentLabel}. ${count.toLocaleString()} total`}
      aria-pressed={active}
      className={`reaction-button${active ? ' is-active' : ''} ${className}`.trim()}
      onClick={() => setActive((current) => !current)}
      type="button"
    >
      <span aria-hidden="true">{symbol}</span>
      <span>{currentLabel}</span>
      <strong>{formattedCount}</strong>
    </button>
  )
}
