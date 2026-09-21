import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'
import { Link } from 'react-router-dom'

interface LinkButtonProps extends PropsWithChildren {
  to: string
  variant?: 'primary' | 'secondary'
}

export function LinkButton({
  to,
  variant = 'primary',
  children,
}: LinkButtonProps) {
  return (
    <Link className={`button cybr-btn button--${variant}`} to={to}>
      <span>{children}</span>
      <span aria-hidden="true">_</span>
      <span aria-hidden="true" className="cybr-btn__glitch">
        {children}_
      </span>
      <span aria-hidden="true" className="cybr-btn__tag">
        R25
      </span>
    </Link>
  )
}

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
}

export function ActionButton({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ActionButtonProps) {
  return (
    <button
      className={`button cybr-btn button--${variant} ${className}`.trim()}
      type="button"
      {...props}
    >
      <span>{children}</span>
      <span aria-hidden="true">_</span>
      <span aria-hidden="true" className="cybr-btn__glitch">
        {children}_
      </span>
      <span aria-hidden="true" className="cybr-btn__tag">
        R25
      </span>
    </button>
  )
}
