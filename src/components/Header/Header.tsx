import { useCallback, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { MobileMenu } from '../MobileMenu/MobileMenu'

const navigationItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/characters', label: 'Characters', end: false },
  { to: '/night-city', label: 'Night City', end: false },
  { to: '/community', label: 'Community', end: false },
]

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <div className="site-header__inner">
          <NavLink aria-label="Afterlife community home" className="brand" to="/">
            <span className="brand__mark" aria-hidden="true">77</span>
            <span>
              <strong>Afterlife</strong>
              <small>Night City network</small>
            </span>
          </NavLink>

          <nav aria-label="Primary navigation" className="desktop-navigation">
            {navigationItems.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  isActive ? 'is-active' : undefined
                }
                end={item.end}
                key={item.to}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            aria-controls="mobile-navigation"
            aria-expanded={menuOpen}
            aria-label="Open navigation menu"
            className="menu-button"
            onClick={() => setMenuOpen(true)}
            type="button"
          >
            <span>Menu</span>
            <span aria-hidden="true">☰</span>
          </button>
        </div>
      </header>
      {menuOpen ? <MobileMenu onClose={closeMenu} /> : null}
    </>
  )
}
