import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

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
  const { pathname } = useLocation()

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
      <div aria-hidden="true" className="cybr-btn mobile-menu__glitch">
        <div className="cybr-btn__glitch mobile-menu__glitch-layer">
          <div className="mobile-menu__topline">
            <h2>Navigation</h2>
            <span className="mobile-menu__glitch-close">Close</span>
          </div>
          <p className="mobile-menu__intro">Explore Night City</p>
          <div className="mobile-menu__nav">
            {navigationItems.map((item, index) => {
              const isActive = item.end
                ? pathname === item.to
                : pathname.startsWith(item.to)

              return (
                <div
                  className={`mobile-menu__link mobile-menu__link--${index + 1}${isActive ? ' is-active' : ''}`}
                  key={item.to}
                >
                  <span>0{index + 1}</span>
                  <strong>{item.label}</strong>
                  <span>→</span>
                </div>
              )
            })}
          </div>
          <p className="mobile-menu__note">Prototype menu</p>
        </div>
      </div>
      <div className="mobile-menu__topline">
        <h2>Navigation</h2>
        <button
          aria-label="Close navigation menu"
          className="mobile-menu__close"
          onClick={onClose}
          ref={closeButtonRef}
          type="button"
        >
          Close
        </button>
      </div>
      <p className="mobile-menu__intro">Explore Night City</p>
      <nav aria-label="Mobile navigation" className="mobile-menu__nav">
        {navigationItems.map((item, index) => (
          <NavLink
            className={({ isActive }) =>
              `mobile-menu__link mobile-menu__link--${index + 1}${isActive ? ' is-active' : ''}`
            }
            end={item.end}
            key={item.to}
            onClick={onClose}
            to={item.to}
          >
            <span aria-hidden="true">0{index + 1}</span>
            <strong>{item.label}</strong>
            <span aria-hidden="true">→</span>
          </NavLink>
        ))}
      </nav>
      <p className="mobile-menu__note">Prototype menu</p>
    </div>
  )
}
