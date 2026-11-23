import { writeStoredValue } from '../hooks/useLocalStorage'

export const localAuthKey = 'cyberpunk:local-auth'
export const usernameMinLength = 3
export const usernameMaxLength = 24
export const passwordMinLength = 12
export const passwordMaxLength = 128

const usernameCharacters = /^[\p{L}\p{N}_-]+$/u
const passwordIterations = 600_000

interface LocalAccount {
  username: string
  salt: string
  hash: string
}

interface LocalAuthState {
  version: 1
  accounts: LocalAccount[]
  activeUsername: string | null
}

export class LocalAuthError extends Error {}

function normalizeUsername(username: string) {
  return username.trim().normalize('NFC')
}

function usernameKey(username: string) {
  return normalizeUsername(username).toLowerCase()
}

function isValidUsername(username: string) {
  return username.length >= usernameMinLength &&
    username.length <= usernameMaxLength &&
    usernameCharacters.test(username)
}

function isLocalAccount(value: unknown): value is LocalAccount {
  return typeof value === 'object' && value !== null &&
    'username' in value && typeof value.username === 'string' && isValidUsername(value.username) &&
    'salt' in value && typeof value.salt === 'string' && /^[A-Za-z0-9+/]{22}==$/.test(value.salt) &&
    'hash' in value && typeof value.hash === 'string' && /^[A-Za-z0-9+/]{43}=$/.test(value.hash)
}

function readAuthState(): LocalAuthState {
  let value: unknown
  try {
    const stored = window.localStorage.getItem(localAuthKey)
    if (stored === null) return { version: 1, accounts: [], activeUsername: null }
    value = JSON.parse(stored)
  } catch {
    throw new LocalAuthError('Could not read local account data in this browser.')
  }

  if (typeof value !== 'object' || value === null ||
    !('version' in value) || value.version !== 1 ||
    !('accounts' in value) || !Array.isArray(value.accounts) || !value.accounts.every(isLocalAccount) ||
    !('activeUsername' in value) || (value.activeUsername !== null && typeof value.activeUsername !== 'string')) {
    throw new LocalAuthError('Could not read local account data in this browser.')
  }

  return { version: 1, accounts: value.accounts, activeUsername: value.activeUsername }
}

function findAccount(state: LocalAuthState, key: string) {
  return state.accounts.find(({ username }) => usernameKey(username) === key)
}

export function readLocalUsername() {
  try {
    const state = readAuthState()
    return state.activeUsername ? findAccount(state, state.activeUsername)?.username ?? null : null
  } catch (error) {
    if (error instanceof LocalAuthError) return null
    throw error
  }
}

async function updateAuthState(update: (state: LocalAuthState) => LocalAuthState) {
  const save = () => {
    const state = readAuthState()
    const next = update(state)
    if (next !== state && !writeStoredValue(localAuthKey, next)) {
      throw new LocalAuthError('Could not save local account data. Check that browser storage is available.')
    }
  }

  if (navigator.locks) await navigator.locks.request(localAuthKey, save)
  else save()
}

function requirePasswordCrypto() {
  if (!globalThis.crypto?.subtle) {
    throw new LocalAuthError('Local accounts require HTTPS or localhost.')
  }
  return globalThis.crypto
}

function toBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
}

async function hashPassword(password: string, salt: Uint8Array<ArrayBuffer>) {
  const { subtle } = requirePasswordCrypto()
  const key = await subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: passwordIterations }, key, 256)
  return toBase64(new Uint8Array(bits))
}

function checkNewUsername(state: LocalAuthState, key: string) {
  if (findAccount(state, key)) {
    throw new LocalAuthError('That username already has a local account. Log in or choose another name.')
  }
}

export async function registerLocalAccount(username: string, password: string) {
  const name = normalizeUsername(username)
  if (!isValidUsername(name)) {
    throw new LocalAuthError('Use 3–24 letters, numbers, hyphens, or underscores for your username.')
  }
  if (password.length < passwordMinLength || password.length > passwordMaxLength) {
    throw new LocalAuthError(`Use ${passwordMinLength}–${passwordMaxLength} characters for your password.`)
  }
  const key = usernameKey(name)
  checkNewUsername(readAuthState(), key)
  const salt = requirePasswordCrypto().getRandomValues(new Uint8Array(16))
  const hash = await hashPassword(password, salt)
  const account = { username: name, salt: toBase64(salt), hash }
  await updateAuthState((state) => {
    checkNewUsername(state, key)
    return { ...state, accounts: [...state.accounts, account], activeUsername: key }
  })
}

export async function logInLocally(username: string, password: string) {
  const key = usernameKey(username)
  const account = findAccount(readAuthState(), key)
  if (!account || !password || password.length > passwordMaxLength) {
    throw new LocalAuthError('Username or password is incorrect.')
  }
  const salt = Uint8Array.from(atob(account.salt), (character) => character.charCodeAt(0))
  if (await hashPassword(password, salt) !== account.hash) {
    throw new LocalAuthError('Username or password is incorrect.')
  }
  await updateAuthState((state) => {
    const current = findAccount(state, key)
    if (current?.salt !== account.salt || current.hash !== account.hash) {
      throw new LocalAuthError('The local account changed. Try logging in again.')
    }
    return { ...state, activeUsername: key }
  })
}

export async function logOutLocally(username: string) {
  await updateAuthState((state) => state.activeUsername === usernameKey(username)
    ? { ...state, activeUsername: null }
    : state)
}
