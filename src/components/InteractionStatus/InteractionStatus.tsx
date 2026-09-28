import type { TransientStatus } from '../../hooks/useTransientStatus'

interface InteractionStatusProps {
  status: TransientStatus | null
}

export function InteractionStatus({ status }: InteractionStatusProps) {
  if (!status) return null

  return (
    <p
      aria-atomic="true"
      aria-live="polite"
      className="interaction-status"
      key={status.id}
      role="status"
    >
      <span aria-hidden="true">✓</span>
      {status.message}
    </p>
  )
}
