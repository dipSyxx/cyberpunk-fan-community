import { readFileSync } from 'node:fs'
import { createPool as mysqlPool, type PoolOptions } from 'mysql2'
import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise'

export const databaseName = 'cyberpunk_community'
export type Db = Pool | PoolConnection
export type Value = string | number | boolean | Date | null

export function required(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing configuration: ${key}`)
  return value
}

export function createDatabase(role: 'app' | 'migration', includeDatabase = true) {
  const host = process.env.CYBERPUNK_DB_HOST || '127.0.0.1'
  const socketPath = process.env.CYBERPUNK_DB_SOCKET
  const tlsCaFile = process.env.CYBERPUNK_DB_TLS_CA
  if (!socketPath && !tlsCaFile && !['localhost', '127.0.0.1', '::1'].includes(host)) {
    throw new Error('Configure verified database TLS or connect over a loopback SSH tunnel')
  }
  const prefix = role === 'app' ? 'CYBERPUNK_DB' : 'CYBERPUNK_MIGRATION'
  const options: PoolOptions = {
    host,
    port: Number(process.env.CYBERPUNK_DB_PORT || 3306),
    socketPath,
    user: required(`${prefix}_USER`),
    password: process.env[`${prefix}_PASSWORD`],
    database: includeDatabase ? databaseName : undefined,
    ssl: tlsCaFile ? { ca: readFileSync(tlsCaFile), rejectUnauthorized: true, verifyIdentity: true } : undefined,
    charset: 'utf8mb4_bin',
    timezone: 'Z',
    connectionLimit: 8,
    queueLimit: 64,
    multipleStatements: false,
  }
  const driver = mysqlPool(options)
  driver.on('connection', (connection) => {
    connection.query("SET time_zone = '+00:00'")
  })
  return { driver, pool: driver.promise() }
}

export async function rows<T>(db: Db, sql: string, values: Value[] = []): Promise<T[]> {
  const [result] = await db.execute<(T & RowDataPacket)[]>(sql, values)
  return result
}

export async function one<T>(db: Db, sql: string, values: Value[] = []): Promise<T | undefined> {
  return (await rows<T>(db, sql, values))[0]
}

export async function execute(db: Db, sql: string, values: Value[] = []) {
  const [result] = await db.execute<ResultSetHeader>(sql, values)
  return result
}

export async function transaction<T>(pool: Pool, work: (db: PoolConnection) => Promise<T>): Promise<T> {
  const db = await pool.getConnection()
  try {
    await db.beginTransaction()
    const result = await work(db)
    await db.commit()
    return result
  } catch (error) {
    await db.rollback()
    throw error
  } finally {
    db.release()
  }
}
