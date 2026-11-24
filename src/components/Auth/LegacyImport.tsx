import { useState } from 'react'
import { useCommunity } from '../../api/communityContext'
import { errorMessage } from '../../api/transport'
import { hasLegacyData, legacyPostLabel, legacySections, readLegacyData } from '../../data/legacyImport'
import { ActionButton } from '../Button/Button'

export function LegacyImport({ username }: { username: string }) {
  const { mutate } = useCommunity()
  const [available] = useState(hasLegacyData)
  const [data, setData] = useState<ReturnType<typeof readLegacyData> | null>(null)
  const [personal, setPersonal] = useState(false)
  const [publish, setPublish] = useState(false)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const sections = data ? legacySections(data) : []
  const postLabels = data?.discussions.map(legacyPostLabel) ?? []
  const publicReplies = data ? Object.values(data.replies).flat() : []

  if (!available) return null

  function preview() {
    setMessage('')
    try {
      setData(readLegacyData())
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not read the old browser data.')
    }
  }

  async function commit() {
    if (!data || busy) return
    const importPersonal = personal && sections.length > 0
    const importPublic = publish && postLabels.length + publicReplies.length > 0
    if (!importPersonal && !importPublic) return
    setBusy(true)
    setMessage('')
    try {
      const { discussions, replies, ...personalData } = data
      await mutate('legacy-import', {
        personal: importPersonal,
        publish: importPublic,
        data: { ...(importPersonal ? personalData : {}), ...(importPublic ? { discussions, replies } : {}) },
      }, 'all')
      if (importPersonal) setPersonal(false)
      if (importPublic) setPublish(false)
      setMessage('Import finished. Your original browser data is still available.')
    } catch (error) {
      setMessage(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="journal-panel" aria-labelledby="old-data-title">
      <h3 id="old-data-title">Import data from this browser</h3>
      <p>Old activity may include records from several people. Import only if the selected data belongs to @{username}.</p>
      {!data ? <ActionButton onClick={preview} variant="secondary">Preview browser data</ActionButton> : <>
        {sections.length > 0 && <>
          <ul>{sections.map(({ label, count }) => <li key={label}>{label} ({count})</li>)}</ul>
          <details>
            <summary>Review personal records</summary>
            <pre style={{ overflow: 'auto', maxHeight: 320, whiteSpace: 'pre-wrap' }}>
              {JSON.stringify({
                favoriteCharacters: data.favoriteCharacters, savedDistricts: data.savedDistricts, votes: data.votes, likes: data.likes,
                rating: data.rating, hideSpoilers: data.hideSpoilers, outings: data.outings, journals: data.journals, dilemmas: data.dilemmas,
              }, null, 2)}
            </pre>
          </details>
          <label className="journal-check">
            <input checked={personal} disabled={busy} onChange={(event) => setPersonal(event.target.checked)} type="checkbox" />
            Import this activity into @{username}
          </label>
        </>}
        {postLabels.length + publicReplies.length > 0 && <>
          <details>
            <summary>Review {postLabels.length} posts and {publicReplies.length} replies</summary>
            {postLabels.map((post, index) => post && <p key={index}><strong>{post.title}</strong><br />{post.message}</p>)}
            {Object.entries(data.replies).map(([thread, replies]) => <div key={thread}>
              <p>Replies to {thread}</p>
              <ul>{replies.map((reply, index) => typeof reply === 'string' && <li key={index}>{reply}</li>)}</ul>
            </div>)}
          </details>
          <label className="journal-check">
            <input checked={publish} disabled={busy} onChange={(event) => setPublish(event.target.checked)} type="checkbox" />
            Publish these posts and replies publicly as @{username}
          </label>
        </>}
        {sections.length === 0 && postLabels.length + publicReplies.length === 0 && <p>No activity to import.</p>}
        <div className="outings__actions">
          <ActionButton disabled={busy || (!personal && !publish)} onClick={() => void commit()}>{busy ? 'Importing…' : 'Confirm import'}</ActionButton>
          <ActionButton disabled={busy} onClick={() => { setData(null); setPersonal(false); setPublish(false); setMessage('') }} variant="secondary">Close preview</ActionButton>
        </div>
      </>}
      {message && <p role="status">{message}</p>}
    </section>
  )
}
