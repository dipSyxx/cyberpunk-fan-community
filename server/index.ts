import { createAuth } from './auth.ts'
import { createDatabase, one, required } from './db.ts'
import { createApi } from './http.ts'

const origin = new URL(required('CYBERPUNK_APP_ORIGIN')).origin
const port = Number(process.env.CYBERPUNK_API_PORT || 3001)
const { driver, pool } = createDatabase('app')
const database = await one<{ available: number }>(pool, 'SELECT 1 AS available')
if (database?.available !== 1) throw new Error('Database connection failed')
const server = createApi({ pool, origin, auth: createAuth(driver, origin), trustProxy: process.env.CYBERPUNK_TRUST_LOCAL_PROXY === '1' })
server.listen(port, '127.0.0.1', () => console.log(`Community API listening on loopback port ${port}`))

function close() {
  server.close(() => { void pool.end() })
}
process.once('SIGINT', close)
process.once('SIGTERM', close)
