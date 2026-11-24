import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useCommunity } from '../../api/communityContext'
import { errorMessage } from '../../api/transport'
import { ActionButton } from '../Button/Button'
import { GlitchContent } from '../Button/GlitchContent'

export type AuthMode = 'login' | 'register'
const passwordMinLength = 12
const passwordMaxLength = 128
const usernameMinLength = 3
const usernameMaxLength = 24

interface AuthDialogProps {
  mode: AuthMode
  onChangeMode: (mode: AuthMode) => void
  onClose: () => void
  onAuthenticated: () => void
}

export function AuthDialog({ mode, onChangeMode, onClose, onAuthenticated }: AuthDialogProps) {
  const { authenticate } = useCommunity()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const usernameRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const registering = mode === 'register'

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    dialog.showModal()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = overflow
    }
  }, [])

  useEffect(() => {
    usernameRef.current?.focus()
  }, [mode])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return

    const data = new FormData(event.currentTarget)
    const username = String(data.get('username') ?? '')
    const password = String(data.get('password') ?? '')
    if (registering && password !== data.get('passwordConfirmation')) {
      setError('Passwords do not match.')
      return
    }

    setError('')
    setBusy(true)
    try {
      await authenticate(mode, { username, password })
      onAuthenticated()
    } catch (error) {
      setError(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  const changeMode = () => {
    setError('')
    onChangeMode(registering ? 'login' : 'register')
  }

  return (
    <dialog
      aria-describedby="auth-dialog-description"
      aria-labelledby="auth-dialog-title"
      className="auth-dialog"
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose()
      }}
      ref={dialogRef}
    >
      <div className="auth-dialog__panel">
        <header className="auth-dialog__header">
          <h2 id="auth-dialog-title">{registering ? 'Create an account' : 'Log in'}</h2>
          <button aria-label="Close account dialog" className="dialog-close" disabled={busy} onClick={onClose} type="button">
            <GlitchContent>Close</GlitchContent>
          </button>
        </header>
        <p id="auth-dialog-description">Sign in to save your Night City activity to your account.</p>
        <form className="journal-form auth-dialog__form" key={mode} onSubmit={submit}>
          <label className="journal-field">
            Username
            <input
              autoCapitalize="none"
              autoComplete="username"
              maxLength={usernameMaxLength}
              minLength={registering ? usernameMinLength : undefined}
              name="username"
              readOnly={busy}
              ref={usernameRef}
              required
              spellCheck={false}
            />
          </label>
          <label className="journal-field">
            Password
            <input
              aria-describedby={registering ? 'auth-password-rules' : undefined}
              autoComplete={registering ? 'new-password' : 'current-password'}
              maxLength={passwordMaxLength}
              minLength={registering ? passwordMinLength : undefined}
              name="password"
              readOnly={busy}
              required
              type="password"
            />
          </label>
          {registering && (
            <>
              <p className="auth-dialog__hint" id="auth-password-rules">Use at least {passwordMinLength} characters.</p>
              <label className="journal-field">
                Confirm password
                <input autoComplete="new-password" maxLength={passwordMaxLength} name="passwordConfirmation" readOnly={busy} required type="password" />
              </label>
            </>
          )}
          {error && <p className="auth-dialog__error" role="alert">{error}</p>}
          <ActionButton disabled={busy} type="submit">
            {busy ? (registering ? 'Creating account…' : 'Logging in…') : (registering ? 'Create account' : 'Log in')}
          </ActionButton>
        </form>
        <button className="auth-dialog__switch" disabled={busy} onClick={changeMode} type="button">
          <GlitchContent>{registering ? 'Already have an account? Log in' : 'Create an account'}</GlitchContent>
        </button>
      </div>
    </dialog>
  )
}
