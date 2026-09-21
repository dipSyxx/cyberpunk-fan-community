import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'

interface MobileMenuProps {
  onClose: () => void
}

const navigationItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/characters', label: 'Characters', end: false },
  { to: '/night-city', label: 'Night City', end: false },
  { to: '/community', label: 'Community', end: false },
]

export function MobileMenu({ onClose }: MobileMenuProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus()
    }
  }, [onClose])

  return (
    <div className="mobile-menu" id="mobile-navigation">
      <div className="mobile-menu__topline">
        <p>Navigation // 01</p>
        <button
          aria-label="Close navigation menu"
          className="icon-button"
          onClick={onClose}
          ref={closeButtonRef}
          type="button"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <nav aria-label="Mobile navigation" className="mobile-menu__nav">
        {navigationItems.map((item, index) => (
          <NavLink
            className={({ isActive }) =>
              `mobile-menu__link${isActive ? ' is-active' : ''}`
            }
            end={item.end}
            key={item.to}
            onClick={onClose}
            to={item.to}
          >
            <span aria-hidden="true">0{index + 1}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <p className="mobile-menu__status">
        <span aria-hidden="true" /> Network status: connected
      </p>
    </div>
  )
}
