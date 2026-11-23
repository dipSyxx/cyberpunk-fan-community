import { GlitchContent } from '../Button/GlitchContent'
import type { AuthMode } from './AuthDialog'

interface AccountControlsProps {
  username: string | null
  signingOut: boolean
  onOpen: (mode: AuthMode, trigger: HTMLButtonElement) => void
  onSignOut: (trigger: HTMLButtonElement) => void
}

export function AccountControls({ username, signingOut, onOpen, onSignOut }: AccountControlsProps) {
  return (
    <div aria-label="Local account" className="account-controls" role="group">
      {username ? (
        <>
          <span className="account-controls__username" title={`@${username}`}>@{username}</span>
          <button disabled={signingOut} onClick={(event) => onSignOut(event.currentTarget)} type="button">
            <GlitchContent>{signingOut ? 'Logging out…' : 'Log out'}</GlitchContent>
          </button>
        </>
      ) : (
        <>
          <button aria-haspopup="dialog" onClick={(event) => onOpen('login', event.currentTarget)} type="button">
            <GlitchContent>Log in</GlitchContent>
          </button>
          <button aria-haspopup="dialog" className="account-controls__register" onClick={(event) => onOpen('register', event.currentTarget)} type="button">
            <GlitchContent>Register</GlitchContent>
          </button>
        </>
      )}
    </div>
  )
}
