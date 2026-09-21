import { useCallback, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { MobileMenu } from '../MobileMenu/MobileMenu'

const navigationItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/characters', label: 'Characters', end: false },
  { to: '/night-city', label: 'Night City', end: false },
  { to: '/community', label: 'Community', end: false },
]

const desktopNavigationItems = navigationItems.filter(
  (item) => item.to !== '/community',
)

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
          <NavLink aria-label="Cyberpunk community home" className="brand" to="/">
            <span>Cyberpunk</span>
            <span className="brand__desktop-suffix">2077</span>
          </NavLink>

          <nav aria-label="Primary navigation" className="desktop-navigation">
            {desktopNavigationItems.map((item) => (
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
            <NavLink
              className={({ isActive }) =>
                `desktop-navigation__cta${isActive ? ' is-active' : ''}`
              }
              to="/community"
            >
              Community
            </NavLink>
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
