import { useCallback, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
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
  const { pathname } = useLocation()

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <div className="site-header__inner">
          <NavLink aria-label="Cyberpunk community home" className="brand" to="/">
            <span>Cyberpunk</span>
            <span className="brand__desktop-suffix"> 2077</span>
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
            {pathname === '/' ? (
              <span className="desktop-sign-in">Sign in</span>
            ) : null}
          </nav>

          <button
            aria-controls="mobile-navigation"
            aria-expanded={menuOpen}
            aria-label="Open navigation menu"
            className="menu-button"
            onClick={() => setMenuOpen(true)}
            type="button"
          >
            Menu
          </button>
        </div>
      </header>
      {menuOpen ? <MobileMenu onClose={closeMenu} /> : null}
    </>
  )
}
