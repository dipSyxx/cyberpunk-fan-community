import { useLocalStorage } from '../../hooks/useLocalStorage'

interface ReactionButtonProps {
  storageKey: string
  initialCount: number
  label: string
  activeLabel: string
  symbol?: string
}

export function ReactionButton({
  storageKey,
  initialCount,
  label,
  activeLabel,
  symbol = '♥',
}: ReactionButtonProps) {
  const [active, setActive] = useLocalStorage(
    `cyberpunk:reaction:${storageKey}`,
    false,
  )
  const currentLabel = active ? activeLabel : label
  const count = initialCount + Number(active)

  return (
    <button
      aria-label={`${currentLabel}. ${count.toLocaleString()} total`}
      aria-pressed={active}
      className={`reaction-button${active ? ' is-active' : ''}`}
      onClick={() => setActive((current) => !current)}
      type="button"
    >
      <span aria-hidden="true">{symbol}</span>
      <span>{currentLabel}</span>
      <strong>{count.toLocaleString()}</strong>
    </button>
  )
}
