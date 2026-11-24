import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { once } from 'node:events'
import { test } from 'node:test'
import { createAuth } from '../auth.ts'
import { createDatabase } from '../db.ts'
import { createApi } from '../http.ts'

const appOrigin = 'https://community.test'
const envIsTest = process.env.CYBERPUNK_DB_TEST === '1'
  && process.env.CYBERPUNK_DB_HOST === '127.0.0.1'
  && Number(process.env.CYBERPUNK_DB_PORT) > 1024
  && process.env.CYBERPUNK_DB_PORT !== '3306'
  && !process.env.CYBERPUNK_DB_SOCKET
  && process.env.CYBERPUNK_DB_USER === 'cyberpunk_test'

test('Community API against a disposable MariaDB database', async (suite) => {
  assert.ok(envIsTest, 'Configure the explicitly enabled disposable loopback database and cyberpunk_test user.')
  const { driver, pool } = createDatabase('app')
  const server = createApi({ pool, auth: createAuth(driver, appOrigin), origin: appOrigin, trustProxy: true })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  suite.after(async () => {
    await new Promise((resolve) => server.close(resolve))
    await pool.end()
  })
  const endpoint = `http://127.0.0.1:${server.address().port}`
  const prefix = randomUUID().slice(0, 12)
  const password = randomUUID()
  let testIp = 0
  const ipPrefix = Number.parseInt(prefix.slice(0, 4), 16)
  const createIp = () => `10.${ipPrefix >> 8}.${ipPrefix & 255}.${++testIp}`

  async function call(path, { data, cookie, origin = appOrigin, ip = createIp(), status = 200 } = {}) {
    const response = await fetch(`${endpoint}/api/${path}`, {
      method: data === undefined ? 'GET' : 'POST',
      headers: {
        Origin: origin, 'Content-Type': 'application/json', 'X-Cyberpunk-Proxy-Client-IP': ip,
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: data === undefined ? undefined : JSON.stringify(data),
    })
    const value = await response.json()
    assert.equal(response.status, status, `${path} returned ${JSON.stringify(value)}`)
    return { value, cookies: response.headers.getSetCookie() }
  }

  async function account(label) {
    const username = `${label}-${prefix}`
    const { cookies } = await call('account/register', { data: { username, password } })
    assert.ok(cookies.some((cookie) => /^__Secure-/.test(cookie) && /HttpOnly/i.test(cookie) && /SameSite=Lax/i.test(cookie) && /; Secure/i.test(cookie)))
    return { username, cookie: cookies.map((item) => item.split(';')[0]).join('; ') }
  }

  const A = await account('runner-a')
  const B = await account('runner-b')
  const statusOf = (path, actor, status) => call(path, { cookie: actor.cookie, status })
  const read = async (path, actor) => (await call(path, { cookie: actor?.cookie })).value
  const action = async (actor, name, data, status = 200) => (await call(`actions/${name}`, { data, cookie: actor?.cookie, status })).value
  const share = async (kind, token, actor, status = 200) => (await call(`shared/${kind}`, { data: { token }, cookie: actor?.cookie, status })).value

  await suite.test('guest reads, session cookies, strict origin, logout and login', async () => {
    assert.deepEqual(await read('health'), { ok: true })
    const guest = await read('site')
    assert.equal(guest.profile, null)
    assert.equal(guest.characters.length, 3)
    assert.equal(guest.districts.length, 4)
    assert.equal(guest.outings.length, 4)
    assert.equal(guest.dilemmas.length, 3)
    assert.equal(guest.poll.length, 3)
    assert.equal((await read('site', A)).profile.username, A.username)
    await call('account/login', { origin: 'https://another.test', data: {}, status: 403 })
    await call('actions/favorite', { origin: 'https://another.test', cookie: A.cookie, data: {}, status: 403 })
    await call('actions/favorite', { data: { id: 'v', selected: true }, status: 401 })
    await call('journal/watson', { status: 401 })
    await call('account/login', { data: { username: A.username, password: 'an incorrect password' }, status: 401 })
    const login = await call('account/login', { data: { username: A.username.toUpperCase(), password } })
    const cookie = login.cookies.map((item) => item.split(';')[0]).join('; ')
    assert.equal((await read('site', { cookie })).profile.username, A.username)
    await call('account/logout', { cookie, data: {} })
    await statusOf('journal/watson', { cookie }, 401)
    await statusOf('outings', { cookie: 'better-auth.session_token=invalid' }, 401)
    await call('account/register', { data: { username: A.username.toUpperCase(), password }, status: 422 })
  })

  await suite.test('favorites, districts, poll, settings and ratings are persistent and isolated', async () => {
    for (const [name, id] of [['favorite', 'v'], ['district', 'watson'], ['vote', 'johnny-silverhand'], ['vote', 'panam-palmer']]) {
      await action(A, name, { id, selected: true, userId: B.username })
    }
    await action(A, 'favorite', { id: 'v', selected: true })
    await action(A, 'favorite', { id: 'missing-character', selected: true }, 404)
    await action(A, 'rating', { rating: 6 }, 400)
    await action(A, 'rating', { rating: 4 })
    await action(B, 'rating', { rating: 2 })
    await action(A, 'spoilers', { hidden: false })
    const one = await read('site', A)
    const two = await read('site', B)
    assert.deepEqual(one.favoriteCharacters, ['v'])
    assert.deepEqual(one.savedDistricts, ['watson'])
    assert.deepEqual(two.favoriteCharacters, [])
    assert.deepEqual(two.savedDistricts, [])
    assert.equal(one.rating, 4)
    assert.equal(two.rating, 2)
    assert.equal(one.profile.hideSpoilers, false)
    assert.equal(two.profile.hideSpoilers, true)
    assert.deepEqual(one.poll.filter(({ selected }) => selected).map(({ id }) => id), ['johnny-silverhand', 'panam-palmer'])
    assert.ok(two.poll.every(({ selected }) => !selected))
    assert.equal(one.ratingAverage, two.ratingAverage)
    await action(A, 'favorite', { id: 'v', selected: false })
    assert.deepEqual((await read('site', A)).favoriteCharacters, [])
  })

  let postId
  await suite.test('Community uses per-user activity, real replies and sticky participation', async () => {
    const post = await action(A, 'discussion', { title: prefix, text: 'A persistent post', spoiler: true })
    postId = post.id
    await action(B, 'like', { id: post.id, selected: true })
    await action(B, 'like', { id: post.id, selected: true })
    const visible = (await read('site')).discussions.find(({ id }) => id === post.id)
    assert.equal(visible.author, A.username)
    assert.equal(visible.likes, 1)
    assert.equal(visible.spoiler, true)
    await action(B, 'like', { id: post.id, selected: false })
    assert.equal((await read('site', B)).profile.participated, true)
    await action(B, 'reply', { discussionId: post.id, text: 'A visible reply' })
    await action(B, 'reply', { discussionId: 'missing', text: 'Missing parent' }, 404)
    const state = (await read('site', B)).discussions.find(({ id }) => id === post.id)
    assert.equal(state.myActivity, true)
    assert.equal(state.mine, false)
    assert.equal(state.replies, 1)
    assert.equal((await read(`replies/${post.id}`))[0].author, B.username)
  })

  await suite.test('outings, concurrent one-active rule, repeat rules, day/night and four-stop relays', async () => {
    const id = 'watson-market-detail'
    const starts = await Promise.allSettled([
      action(A, 'start-outing', { templateId: id }),
      action(A, 'start-outing', { templateId: id }),
    ])
    assert.equal(starts.filter(({ status }) => status === 'fulfilled').length, 1)
    assert.match(starts.find(({ status }) => status === 'rejected').reason.message, /returned.*Finish the active outing/)
    const active = (await read('outings', A)).active
    assert.equal((await read('outings', B)).active, null)
    await action(B, 'complete-outing', { id: active.id, note: 'Other account' }, 409)
    await action(A, 'complete-outing', { id: active.id, note: 'Private outing note', time: 'day' })
    await action(A, 'start-outing', { templateId: id }, 409)
    await action(A, 'label-outing', { id: active.id, time: 'night' })
    assert.equal((await read('outings', A)).entries[0].inGameTime, 'night')
    let { token } = await action(A, 'create-clue', { runId: active.id, title: 'First stop', hint: 'Look near the sign' })
    const first = await share('clue', token)
    assert.equal(first.previousStops.length, 0)
    assert.ok(!JSON.stringify(first).includes('Private outing note'))
    await action(B, 'start-outing', { clueId: first.id }, 404)
    await action(B, 'save-clue', { token })
    assert.equal((await read('outings', B)).savedClues.length, 1)
    await action(B, 'remove-clue', { id: first.id })
    assert.equal((await read('outings', B)).savedClues.length, 0)
    for (let step = 2; step <= 5; step += 1) {
      const actor = step % 2 === 0 ? B : A
      await action(actor, 'start-outing', { token })
      const run = (await read('outings', actor)).active
      await action(actor, 'complete-outing', { id: run.id, note: `Private note ${step}` })
      const result = await action(actor, 'create-clue', { runId: run.id, title: `Stop ${step}`, hint: 'Another clue' }, step === 5 ? 409 : 200)
      if (step <= 4) {
        token = result.token
        assert.equal((await share('clue', token)).previousStops.length, step - 1)
      }
    }
    for (const templateId of ['westbrook-japantown-stop', 'pacifica-quiet-corner', 'heywood-meeting-place']) {
      await action(A, 'start-outing', { templateId })
      const run = (await read('outings', A)).active
      await action(A, 'complete-outing', { id: run.id, note: 'Completed' })
    }
    await action(A, 'start-outing', { templateId: id })
    const repeat = (await read('outings', A)).active
    await action(A, 'complete-outing', { id: repeat.id, note: 'Completed again', time: 'day' })
    assert.equal((await read('outings', A)).entries.filter(({ outing }) => outing.id === id).length, 2)
  })

  await suite.test('district notes, snapshot collections, finding observation sharing and duplicate prevention', async () => {
    await action(A, 'journal-note', { districtId: 'watson', note: 'A private note' })
    await action(A, 'journal-note', { districtId: 'watson', note: 'Another private note' })
    const entries = (await read('journal/watson', A)).entries
    const ids = entries.map(({ id }) => id)
    assert.deepEqual((await read('journal/watson', B)).entries, [])
    await action(B, 'create-collection', { districtId: 'watson', entries: ids, title: 'Other owner' }, 404)
    await action(A, 'create-collection', { districtId: 'watson', entries: ids.slice(0, 1), title: 'Invalid size' }, 400)
    await action(A, 'create-collection', { districtId: 'watson', entries: [ids[0], ids[0]], title: 'Duplicate note' }, 400)
    const coll = await action(A, 'create-collection', { districtId: 'watson', entries: ids, title: 'A real collection' })
    await action(B, 'copy-collection', { id: coll.id }, 404)
    const collShare = await action(A, 'share-collection', coll)
    assert.equal((await share('collection', collShare.token)).collection.entries.length, 2)
    await action(B, 'save-collection', { districtId: 'pacifica', token: collShare.token }, 404)
    await action(B, 'save-collection', { districtId: 'watson', token: collShare.token })
    await action(B, 'save-collection', { districtId: 'watson', token: collShare.token })
    await action(B, 'copy-collection', coll)
    await action(B, 'copy-collection', coll)
    assert.equal((await read('journal/watson', B)).entries.length, 2)
    assert.equal((await read('journal/watson', B)).collections.length, 1)
    await action(B, 'import-note', { districtId: 'watson', entry: entries[0] }, 409)

    const check = await action(A, 'create-finding', { districtId: 'watson', entryId: ids[0], place: 'At the corner', time: 'night' })
    await action(B, 'add-observation', { checkId: check.id, note: 'No permission', time: 'day', result: 'different' }, 404)
    const checkShare = await action(A, 'share-check', check)
    await action(B, 'save-finding', { districtId: 'watson', kind: 'check', token: checkShare.token })
    const report = await action(B, 'add-observation', { checkId: check.id, note: 'A private observation', time: 'day', result: 'confirmed' })
    assert.deepEqual((await read('journal/watson', A)).checks[0].reports, [])
    await action(A, 'copy-observation', report, 404)
    const reportShare = await action(B, 'share-observation', report)
    assert.equal((await share('observation', reportShare.token)).report.note, 'A private observation')
    await action(A, 'save-finding', { districtId: 'watson', kind: 'observation', token: reportShare.token })
    await action(A, 'copy-observation', report)
    assert.equal((await read('journal/watson', A)).entries.length, 3)
  })

  await suite.test('dilemma snapshots survive edits and recipients must answer first', async () => {
    await action(A, 'dilemma-response', { characterId: 'v', text: 'The original answer', spoiler: true })
    const shared = await action(A, 'share-argument', { characterId: 'v' })
    await share('argument', shared.token, B, 403)
    await action(B, 'save-argument', { characterId: 'v', token: shared.token }, 403)
    await action(B, 'dilemma-response', { characterId: 'v', text: 'Recipient’s answer', spoiler: false })
    await action(A, 'dilemma-response', { characterId: 'v', text: 'The edited answer', spoiler: false })
    assert.equal((await share('argument', shared.token, B)).text, 'The original answer')
    await action(B, 'save-argument', { characterId: 'v', token: shared.token })
    await action(B, 'save-argument', { characterId: 'v', token: shared.token })
    const receiver = await read('dilemma/v', B)
    assert.equal(receiver.received.length, 1)
    assert.equal(receiver.received[0].spoiler, true)
    assert.equal((await read('dilemma/v', A)).own.text, 'The edited answer')
  })

  await suite.test('legacy imports left private unless confirmed, are idempotent and roll back on validation errors', async () => {
    const now = new Date().toISOString()
    const note = { id: randomUUID(), note: 'Imported private note', createdAt: now }
    const legacyPost = { id: 'local-1234', title: `legacy-${prefix}`, excerpt: 'An approved legacy post' }
    const data = {
      journals: { 'westbrook': { entries: [note] } },
      discussions: [legacyPost], replies: { 'local-1234': ['Legacy reply'] },
      favoriteCharacters: ['v'],
    }
    await action(A, 'legacy-import', { personal: true, publish: false, data })
    assert.equal((await read('journal/westbrook', A)).entries.length, 1)
    assert.equal((await read('journal/westbrook', B)).entries.length, 0)
    assert.ok(!(await read('site')).discussions.some(({ title }) => title === legacyPost.title))
    await action(A, 'legacy-import', { personal: true, publish: true, data })
    await action(A, 'legacy-import', { personal: true, publish: true, data })
    const posts = (await read('site')).discussions.filter(({ title }) => title === legacyPost.title)
    assert.equal(posts.length, 1)
    assert.equal((await read(`replies/${posts[0].id}`)).length, 1)
    assert.equal((await read('journal/westbrook', A)).entries.length, 1)
    await action(B, 'legacy-import', { personal: true, publish: false,
      data: { favoriteCharacters: ['v'], journals: { watson: { entries: [{ ...note, createdAt: 'invalid' }] } } } }, 400)
    assert.deepEqual((await read('site', B)).favoriteCharacters, [])
    assert.notEqual(postId, posts[0].id)
  })

  await suite.test('legacy outings, relays, journals, finding reports and received arguments survive import', async () => {
    const timestamp = new Date().toISOString()
    const first = { id: randomUUID(), note: 'A legacy journal note', createdAt: timestamp }
    const second = { id: randomUUID(), note: 'A second legacy note', createdAt: timestamp, imported: true }
    const prev = { id: 'fan-' + randomUUID(), title: 'One stop', prompt: 'Old hint' }
    const clue = { id: 'fan-' + randomUUID(), title: 'Next stop', prompt: 'Next old hint', districtId: 'pacifica', previousStops: [prev] }
    const oldCheck = { id: randomUUID(), note: first.note, place: 'Near the district entrance', time: 'night' }
    const oldReport = { id: randomUUID(), note: 'A legacy finding report', time: 'day', result: 'different', createdAt: timestamp }
    const legacy = {
      personal: true, publish: false, data: {
        outings: {
          activeOutingId: 'pacifica-quiet-corner',
          entries: [{ id: 1, outingId: 'heywood-meeting-place', note: 'A legacy outing', completedAt: timestamp, inGameTime: 'day' }],
          savedClues: [clue],
        },
        journals: { pacifica: {
          entries: [first, second], collections: [{ id: randomUUID(), title: 'Legacy collection', entries: [first, second] }],
          checks: [{ request: oldCheck, reports: [oldReport] }],
        } },
        dilemmas: { 'judy-alvarez': {
          own: { id: randomUUID(), characterId: 'judy-alvarez', text: 'My old response', spoiler: false },
          received: [{ id: randomUUID(), characterId: 'judy-alvarez', text: 'An old shared argument', spoiler: true }],
        } },
      },
    }
    await action(B, 'legacy-import', legacy)
    await action(B, 'legacy-import', legacy)
    const journal = await read('journal/pacifica', B)
    assert.equal(journal.entries.length, 2)
    assert.equal(journal.entries.find(({ id }) => id === second.id).imported, true)
    assert.equal(journal.collections.length, 1)
    assert.equal(journal.collections[0].token, undefined)
    assert.equal(journal.checks[0].reports[0].sourceId, oldReport.id)
    const outings = await read('outings', B)
    assert.equal(outings.active.outing.id, 'pacifica-quiet-corner')
    assert.equal(outings.entries.filter(({ note }) => note === 'A legacy outing').length, 1)
    assert.equal(outings.savedClues[0].previousStops.length, 1)
    assert.equal((await read('dilemma/judy-alvarez', B)).received.length, 1)
    assert.equal((await read('dilemma/judy-alvarez', A)).own, null)
  })

  await suite.test('sensitive endpoint rate limiting', async () => {
    const ip = `203.0.${Math.floor(Math.random() * 240) + 2}.${Math.floor(Math.random() * 240) + 2}`
    for (let attempt = 1; attempt <= 11; attempt += 1) {
      await call('account/login', { ip, data: { username: A.username, password: 'Incorrect123!' }, status: attempt === 11 ? 429 : 401 })
    }
  })
})
