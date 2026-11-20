import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

interface MobileMenuProps {
  onClose: () => void
}

const navigationItems = [
  { to: '/', label: 'My Night City', end: true },
  { to: '/characters', label: 'Characters', end: false },
  { to: '/night-city', label: 'Night City', end: false },
  { to: '/community', label: 'Community', end: false },
]

export function MobileMenu({ onClose }: MobileMenuProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { pathname } = useLocation()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const previousFocus = document.activeElement
    const originalOverflow = document.body.style.overflow
    dialog.showModal()
    document.body.style.overflow = 'hidden'

    return () => {
      dialog.close()
      document.body.style.overflow = originalOverflow
      if (previousFocus instanceof HTMLElement) previousFocus.focus()
    }
  }, [])

  return (
    <dialog
      aria-labelledby="mobile-navigation-title"
      className="mobile-menu"
      id="mobile-navigation"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      ref={dialogRef}
    >
      <div aria-hidden="true" className="cybr-btn mobile-menu__glitch">
        <div className="cybr-btn__glitch mobile-menu__glitch-layer">
          <div className="mobile-menu__topline">
            <h2>Navigation</h2>
            <span className="mobile-menu__glitch-close">Close</span>
          </div>
          <p className="mobile-menu__intro">Build your local fan profile</p>
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
          <p className="mobile-menu__note">Your choices stay on this device</p>
        </div>
      </div>
      <div className="mobile-menu__topline">
        <h2 id="mobile-navigation-title">Navigation</h2>
        <button
          aria-label="Close navigation menu"
          className="mobile-menu__close"
          onClick={onClose}
          type="button"
        >
          Close
        </button>
      </div>
      <p className="mobile-menu__intro">Build your local fan profile</p>
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
      <p className="mobile-menu__note">Your choices stay on this device</p>
    </dialog>
  )
}
