import { useCallback, useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useCommunity } from '../../api/communityContext'
import { errorMessage } from '../../api/transport'
import { useTransientStatus } from '../../hooks/useTransientStatus'
import { AccountControls } from '../Auth/AccountControls'
import { AuthDialog, type AuthMode } from '../Auth/AuthDialog'
import { GlitchContent } from '../Button/GlitchContent'
import { InteractionStatus } from '../InteractionStatus/InteractionStatus'
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
  const { authenticate, site: { profile } } = useCommunity()
  const [menuOpen, setMenuOpen] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode | null>(null)
  const username = profile?.username ?? null
  const [signingOut, setSigningOut] = useState(false)
  const desktopNavRef = useRef<HTMLElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const restoreFocusRef = useRef<HTMLButtonElement | null>(null)
  const { status, showStatus } = useTransientStatus()
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  useEffect(() => {
    const opener = restoreFocusRef.current
    if (!opener || authMode || menuOpen || signingOut) return
    restoreFocusRef.current = null
    if (opener.isConnected && opener.getClientRects().length) {
      opener.focus()
    } else if (menuButtonRef.current?.getClientRects().length) {
      menuButtonRef.current.focus()
    } else {
      desktopNavRef.current?.querySelector<HTMLButtonElement>('.account-controls button')?.focus()
    }
  }, [authMode, menuOpen, signingOut, username])

  const openAuth = (mode: AuthMode, trigger: HTMLButtonElement) => {
    restoreFocusRef.current = menuOpen ? menuButtonRef.current : trigger
    closeMenu()
    setAuthMode(mode)
  }

  const finishAuth = () => {
    setAuthMode(null)
    showStatus(authMode === 'register' ? 'Account created.' : 'Logged in.')
  }

  const signOut = async (trigger: HTMLButtonElement) => {
    if (!username || signingOut) return
    restoreFocusRef.current = menuOpen ? menuButtonRef.current : trigger
    setSigningOut(true)
    try {
      await authenticate('logout')
      showStatus('Logged out.')
    } catch (error) {
      showStatus(errorMessage(error))
    } finally {
      setSigningOut(false)
      closeMenu()
    }
  }

  const accountControls = <AccountControls username={username} signingOut={signingOut} onOpen={openAuth} onSignOut={signOut} />

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

          <nav aria-label="Primary navigation" className="desktop-navigation" ref={desktopNavRef}>
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
            {accountControls}
          </nav>

          <button
            aria-controls="mobile-navigation"
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            aria-label="Open navigation menu"
            className="menu-button"
            onClick={() => setMenuOpen(true)}
            ref={menuButtonRef}
            type="button"
          >
            <GlitchContent>Menu</GlitchContent>
          </button>
        </div>
      </header>
      {menuOpen && <MobileMenu accountControls={accountControls} onClose={closeMenu} />}
      {authMode && <AuthDialog mode={authMode} onAuthenticated={finishAuth} onChangeMode={setAuthMode} onClose={() => setAuthMode(null)} />}
      <InteractionStatus status={status} />
    </>
  )
}
