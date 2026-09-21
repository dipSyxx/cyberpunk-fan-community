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
    <Link className={`button button--${variant}`} to={to}>
      <span>{children}</span>
      <span aria-hidden="true">↗</span>
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
      className={`button button--${variant} ${className}`.trim()}
      type="button"
      {...props}
    >
      {children}
    </button>
  )
}
