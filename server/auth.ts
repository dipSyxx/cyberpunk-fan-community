import { createHash } from 'node:crypto'
import { betterAuth } from 'better-auth'
import type { Pool } from 'mysql2'
import { required } from './db.ts'

export function createAuth(database: Pool, origin: string) {
  const secret = required('CYBERPUNK_AUTH_SECRET')
  if (secret.length < 32) throw new Error('CYBERPUNK_AUTH_SECRET requires at least 32 characters')
  const { hostname, protocol } = new URL(origin)
  const secure = protocol === 'https:'
  if (!secure && (protocol !== 'http:' || !['localhost', '127.0.0.1', '[::1]'].includes(hostname))) {
    throw new Error('A public origin must use HTTPS')
  }
  const mysql = {
    pool: database,
    getConnection: database.getConnection.bind(database),
    end: database.end.bind(database),
  }
  return betterAuth({
    database: mysql,
    secret,
    baseURL: origin,
    basePath: '/api/auth',
    trustedOrigins: [origin],
    emailAndPassword: { enabled: true, minPasswordLength: 12, maxPasswordLength: 128 },
    user: { modelName: 'auth_users' },
    session: { modelName: 'auth_sessions', cookieCache: { enabled: false }, disableSessionRefresh: true },
    account: { modelName: 'auth_accounts' },
    verification: { modelName: 'auth_verifications' },
    advanced: {
      database: { generateId: 'uuid' },
      useSecureCookies: secure,
      ipAddress: { ipAddressHeaders: ['x-cyberpunk-client-ip'] },
    },
    rateLimit: {
      enabled: true, storage: 'database', modelName: 'auth_rate_limits',
      customRules: {
        '/sign-up/email': { window: 60, max: 5 },
        '/sign-in/email': { window: 60, max: 10 },
        '/sign-out': { window: 60, max: 20 },
      },
    },
    telemetry: { enabled: false },
    logger: { disabled: true },
  })
}

export function accountIdentity(value: unknown) {
  if (typeof value !== 'string') return null
  const username = value.trim().normalize('NFC')
  if (username.length < 3 || username.length > 24 || !/^[\p{L}\p{N}_-]+$/u.test(username)) return null
  const key = createHash('sha256').update(username.toLowerCase()).digest('hex')
  return { username, email: `${key}@account.invalid` }
}
