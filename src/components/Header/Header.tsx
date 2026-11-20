import { useCallback, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { GlitchContent } from '../Button/GlitchContent'
import { MobileMenu } from '../MobileMenu/MobileMenu'

const navigationItems = [
  { to: '/', label: 'My Night City', end: true },
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
        <GlitchContent>Skip to content</GlitchContent>
      </a>
      <header className="site-header">
        <div className="site-header__inner">
          <NavLink aria-label="Cyberpunk community home" className="brand" to="/">
            <GlitchContent>Cyberpunk 2077</GlitchContent>
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
                <GlitchContent>{item.label}</GlitchContent>
              </NavLink>
            ))}
            <NavLink
              className={({ isActive }) =>
                `desktop-navigation__cta${isActive ? ' is-active' : ''}`
              }
              to="/community"
            >
              <GlitchContent>Community</GlitchContent>
            </NavLink>
          </nav>

          <button
            aria-controls="mobile-navigation"
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            aria-label="Open navigation menu"
            className="menu-button"
            onClick={() => setMenuOpen(true)}
            type="button"
          >
            <GlitchContent>Menu</GlitchContent>
          </button>
        </div>
      </header>
      {menuOpen ? <MobileMenu onClose={closeMenu} /> : null}
    </>
  )
}
