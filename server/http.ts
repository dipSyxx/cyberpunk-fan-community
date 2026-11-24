import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { isIP } from 'node:net'
import type { Pool } from 'mysql2/promise'
import type { createAuth } from './auth.ts'
import { accountIdentity } from './auth.ts'
import { communityAction, discussionReplies, establishProfile, siteData } from './community.ts'
import { one, transaction } from './db.ts'
import { dilemmaAction, dilemmaData, sharedArgument } from './dilemmas.ts'
import { journalAction, journalData, sharedCollection, sharedFinding } from './journals.ts'
import { importLegacy } from './legacy.ts'
import { outingAction, outingClue, userOutings } from './outings.ts'
import { byToken } from './shares.ts'
import { capability, HttpError, record, slug } from './validate.ts'

function json(res: ServerResponse, status: number, data: unknown, cookies: string[] = []) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'no-referrer')
  if (cookies.length) res.setHeader('Set-Cookie', cookies)
  res.statusCode = status
  res.end(JSON.stringify(data))
}

async function body(req: IncomingMessage, max: number) {
  if (req.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    throw new HttpError(415, 'Send application/json.')
  }
  if (Number(req.headers['content-length']) > max) throw new HttpError(413, 'This request is too large.')
  const parts: Buffer[] = []
  let size = 0
  for await (const value of req.iterator({ destroyOnReturn: false })) {
    const chunk = Buffer.isBuffer(value) ? value : Buffer.from(String(value))
    size += chunk.length
    if (size > max) {
      req.resume()
      throw new HttpError(413, 'This request is too large.')
    }
    parts.push(chunk)
  }
  let input: unknown
  try {
    input = JSON.parse(Buffer.concat(parts).toString('utf8')) as unknown
  } catch {
    throw new HttpError(400, 'Invalid JSON.')
  }
  return record(input)
}

function headersFor(req: IncomingMessage, trustProxy: boolean) {
  const headers = new Headers()
  for (const key of ['cookie', 'origin', 'user-agent', 'sec-fetch-site', 'sec-fetch-mode', 'sec-fetch-dest']) {
    const value = req.headers[key]
    if (typeof value === 'string') headers.set(key, value)
  }
  const peer = req.socket.remoteAddress
  const forwarded = req.headers['x-cyberpunk-proxy-client-ip']
  const clientIP = trustProxy && typeof forwarded === 'string' && isIP(forwarded)
    && ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(peer ?? '')
    ? forwarded : peer
  if (clientIP) headers.set('x-cyberpunk-client-ip', clientIP)
  return headers
}

type Auth = ReturnType<typeof createAuth>

async function accountRequest(auth: Auth, origin: string, path: string, data: Record<string, unknown>, headers: Headers, res: ServerResponse) {
  const endpoint = path === 'register' ? 'sign-up/email' : path === 'login' ? 'sign-in/email' : 'sign-out'
  let payload = {}
  if (path !== 'logout') {
    const identity = accountIdentity(data.username)
    const password = data.password
    if (!identity || typeof password !== 'string' || password.length > 128 || password.length < (path === 'register' ? 12 : 1)) {
      throw new HttpError(400, path === 'register'
        ? 'Choose a 3–24 character username and a 12–128 character password.' : 'Username or password is incorrect.')
    }
    payload = { ...identity, name: identity.username, password }
  }
  headers.set('Content-Type', 'application/json')
  const result = await auth.handler(new Request(`${origin}/api/auth/${endpoint}`, { method: 'POST', headers, body: JSON.stringify(payload) }))
  if (result.status === 429) {
    res.setHeader('Retry-After', result.headers.get('Retry-After') ?? '60')
    throw new HttpError(429, 'Too many attempts. Wait a minute and try again.')
  }
  if (!result.ok) {
    if (result.status >= 500) throw new HttpError(503, 'Accounts are temporarily unavailable.')
    throw new HttpError(path === 'login' ? 401 : result.status,
      path === 'login' ? 'Username or password is incorrect.' :
        path === 'register' ? 'Could not register with that username. Try signing in or choose another username.' : 'Could not sign out.')
  }
  json(res, 200, { ok: true }, result.headers.getSetCookie())
}

export function createApi(options: { pool: Pool, auth: Auth, origin: string, trustProxy?: boolean }) {
  const { pool, auth, origin, trustProxy = false } = options
  return createServer({ requestTimeout: 30_000, headersTimeout: 10_000 }, async (req, res) => {
    try {
      const method = req.method
      const path = new URL(req.url ?? '/', origin).pathname.split('/').slice(1)
      if (path[0] !== 'api' || (method !== 'GET' && method !== 'POST')) throw new HttpError(404, 'Unknown endpoint.')
      if (method === 'POST' && req.headers.origin !== origin) throw new HttpError(403, 'Request origin is not allowed.')
      const headers = headersFor(req, trustProxy)
      if (path.length === 3 && path[1] === 'account' && method === 'POST' && ['register', 'login', 'logout'].includes(path[2])) {
        await accountRequest(auth, origin, path[2], await body(req, 4096), headers, res)
        return
      }
      if (path[1] === 'health' && path.length === 2 && method === 'GET') {
        await one(pool, 'SELECT 1 FROM profiles LIMIT 1')
        json(res, 200, { ok: true })
        return
      }
      const session = await auth.api.getSession({ headers })
      const user = session?.user.id ?? null
      if (session) await establishProfile(pool, session.user)

      if (method === 'GET') {
        if (path[1] === 'site' && path.length === 2) return json(res, 200, await siteData(pool, user))
        if (path[1] === 'replies' && path.length === 3) return json(res, 200, await discussionReplies(pool, slug(path[2])))
        if (!user) throw new HttpError(401, 'Sign in to continue.')
        if (path[1] === 'outings' && path.length === 2) return json(res, 200, await userOutings(pool, user))
        if (path[1] === 'journal' && path.length === 3) return json(res, 200, await journalData(pool, user, slug(path[2])))
        if (path[1] === 'dilemma' && path.length === 3) return json(res, 200, await dilemmaData(pool, user, slug(path[2])))
      } else if (path[1] === 'shared' && path.length === 3) {
        const token = capability((await body(req, 4096)).token)
        switch (path[2]) {
          case 'clue': return json(res, 200, await outingClue(pool, await byToken(pool, 'clue', token)))
          case 'collection': return json(res, 200, await sharedCollection(pool, token))
          case 'check': case 'observation': return json(res, 200, await sharedFinding(pool, path[2], token))
          case 'argument': return json(res, 200, await sharedArgument(pool, user, token))
        }
      } else if (path[1] === 'actions' && path.length === 3) {
        if (!user) throw new HttpError(401, 'Sign in to make changes.')
        const action = path[2]
        const data = await body(req, action === 'legacy-import' ? 524_288 : 16_384)
        const output = await transaction(pool, async (db) => {
          // Serialize writes that can change multiple records for the same account.
          await one(db, 'SELECT user_id FROM profiles WHERE user_id = ? FOR UPDATE', [user])
          if (action === 'legacy-import') return importLegacy(db, user, data)
          return await communityAction(db, user, action, data) ?? await outingAction(db, user, action, data)
            ?? await journalAction(db, user, action, data) ?? await dilemmaAction(db, user, action, data)
        })
        if (output !== null) return json(res, 200, output)
      }
      throw new HttpError(404, 'Unknown endpoint.')
    } catch (error) {
      if (error instanceof HttpError) return json(res, error.status, { error: error.message })
      const code = error && typeof error === 'object' && 'code' in error ? error.code : null
      if (code === 'ER_NO_REFERENCED_ROW_2') return json(res, 404, { error: 'The selected item is unavailable.' })
      if (code === 'ER_DUP_ENTRY') return json(res, 409, { error: 'This change conflicts with existing data.' })
      if (code === 'ER_LOCK_DEADLOCK' || code === 'ER_LOCK_WAIT_TIMEOUT') return json(res, 409, { error: 'Another change was saved. Try again.' })
      console.error('API request failed', typeof code === 'string' && /^[A-Z0-9_]+$/.test(code) ? code : 'INTERNAL_ERROR')
      json(res, 500, { error: 'The server could not complete this request.' })
    }
  })
}
