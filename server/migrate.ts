import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { createDatabase, databaseName, execute, one, rows } from './db.ts'

const migrationFolder = new URL('./migrations/', import.meta.url)
const command = process.argv[2]

async function migrate() {
  if (command === 'init') {
    const { pool } = createDatabase('migration', false)
    try {
      await execute(pool, 'CREATE DATABASE IF NOT EXISTS cyberpunk_community CHARACTER SET utf8mb4 COLLATE utf8mb4_bin')
    } finally {
      await pool.end()
    }
    console.log(`Initialized ${databaseName}`)
    return
  }
  if (command !== 'apply' && command !== 'status') throw new Error('Expected init, apply, or status')

  const { pool } = createDatabase('migration')
  const db = await pool.getConnection()
  let locked = false
  try {
    const charset = await one<{ collation: string }>(db,
      'SELECT DEFAULT_COLLATION_NAME AS collation FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = DATABASE()')
    if (charset?.collation !== 'utf8mb4_bin') throw new Error('The community database must use utf8mb4_bin')
    if (command === 'apply') {
      locked = (await one<{ acquired: number }>(db, "SELECT GET_LOCK('cyberpunk_community:migrations', 20) AS acquired"))?.acquired === 1
      if (!locked) throw new Error('Could not acquire the migration lock')
      await execute(db, `CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(80) PRIMARY KEY, checksum CHAR(64) NOT NULL,
        applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB`)
    }
    const ledger = await one(db, "SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'schema_migrations'")
    const applied = new Map((ledger ? await rows<{ version: string, checksum: string }>(db,
      'SELECT version, checksum FROM schema_migrations') : []).map((item) => [item.version, item.checksum]))
    const files = (await readdir(migrationFolder)).filter((name) => /^\d{3}-[a-z.-]+\.sql$/.test(name)).sort()
    for (const version of applied.keys()) if (!files.includes(version)) throw new Error(`Unknown applied migration: ${version}`)
    for (const file of files) {
      const contents = await readFile(new URL(file, migrationFolder), 'utf8')
      const checksum = createHash('sha256').update(contents.replaceAll('\r\n', '\n')).digest('hex')
      const recorded = applied.get(file)
      if (recorded && recorded !== checksum) throw new Error(`Checksum mismatch: ${file}`)
      if (recorded || command === 'status') {
        console.log(`${recorded ? 'applied' : 'pending'} ${file}`)
        if (!recorded) process.exitCode = 1
        continue
      }
      const statements = contents.split(/;[ \t]*(?:\r?\n|$)/).map((statement) => statement.trim()).filter(Boolean)
      for (const statement of statements) await execute(db, statement)
      await execute(db, 'INSERT INTO schema_migrations (version, checksum) VALUES (?, ?)', [file, checksum])
      console.log(`applied ${file}`)
    }
    const tables = await rows<{ name: string }>(db,
      'SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME')
    console.log(`${databaseName}: ${tables.length} tables`)
  } finally {
    if (locked) await execute(db, "DO RELEASE_LOCK('cyberpunk_community:migrations')")
    db.release()
    await pool.end()
  }
}

try {
  await migrate()
} catch (error) {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : null
  console.error(code ? `Migration failed (${code})` : error instanceof Error ? error.message : 'Migration failed')
  process.exitCode = 1
}
