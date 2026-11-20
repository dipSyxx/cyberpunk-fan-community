import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ActionButton } from '../../components/Button/Button'
import { GlitchContent } from '../../components/Button/GlitchContent'
import { DiscussionCard } from '../../components/DiscussionCard/DiscussionCard'
import { InteractionStatus } from '../../components/InteractionStatus/InteractionStatus'
import { PageMarker } from '../../components/PageMarker/PageMarker'
import { discussionHasSpoilers, discussions, hideSpoilersKey, type Discussion } from '../../data/discussions'
import { readStoredValue, useLocalStorage, writeStoredValue } from '../../hooks/useLocalStorage'
import { useTransientStatus } from '../../hooks/useTransientStatus'

interface LocalDiscussion extends Discussion {
  createdLocally: true
}

const replyKey = (id: string) => `cyberpunk:discussion-replies:${id}`

export function Community() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const activeSpoilerRef = useRef<HTMLElement>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const activeThread = searchParams.get('thread')
  const [hideSpoilers, setHideSpoilers] = useLocalStorage(hideSpoilersKey, true)
  const [revealedDiscussions, setRevealedDiscussions] = useState<string[]>([])
  const [localDiscussions, setLocalDiscussions] = useLocalStorage<
    LocalDiscussion[]
  >('cyberpunk:local-discussions', [])
  const feed = [...localDiscussions, ...discussions]
  const [repliesByDiscussion, setRepliesByDiscussion] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(feed.map(({ id }) => [id, readStoredValue<string[]>(replyKey(id), [])])),
  )
  const [, setHasParticipated] = useLocalStorage<boolean>(
    'cyberpunk:community-participated',
    false,
  )
  const { status, showStatus } = useTransientStatus()
  const markParticipation = () => setHasParticipated(true)
  const localDiscussionIds = new Set(localDiscussions.map(({ id }) => id))
  const myActivity = feed.filter(({ id }) =>
    localDiscussionIds.has(id) || (repliesByDiscussion[id]?.length ?? 0) > 0,
  )
  const isHidden = (discussion: Discussion) =>
    hideSpoilers && discussionHasSpoilers(discussion) && !revealedDiscussions.includes(discussion.id)
  const hiddenActive = feed.some((discussion) => discussion.id === activeThread && isHidden(discussion))

  useEffect(() => {
    if (hiddenActive) activeSpoilerRef.current?.focus()
  }, [activeThread, hiddenActive])

  const saveReply = (id: string, reply: string) => {
    const nextReplies = [...(repliesByDiscussion[id] ?? []), reply]
    if (!writeStoredValue(replyKey(id), nextReplies)) return false

    setRepliesByDiscussion((current) => ({ ...current, [id]: nextReplies }))
    markParticipation()
    return true
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    const title = String(formData.get('title') ?? '').trim()
    const excerpt = String(formData.get('message') ?? '').trim()

    if (!title || !excerpt) return

    setLocalDiscussions((current) => [
      {
        id: `local-${Date.now()}`,
        title,
        excerpt,
        author: 'local_merc',
        time: 'Just now',
        tag: 'Community',
        likes: 0,
        replies: 0,
        spoiler: formData.get('spoiler') === 'on',
        accent: 'cyan',
        createdLocally: true,
      },
      ...current,
    ])
    markParticipation()
    showStatus('Post added to your local community feed')

    form.reset()
    dialogRef.current?.close()
  }

  return (
    <div className="figma-page figma-page--community">
      <header className="page-title community-heading">
        <div className="community-heading__copy">
          <p className="community-kicker">Local prototype</p>
          <h1 className="glitch-heading glitch-heading--yellow">Community</h1>
          <p>
            Community prototype — posts, likes, and replies are stored only in
            this browser.
          </p>
        </div>
        <ActionButton onClick={() => dialogRef.current?.showModal()}>
          + New post
        </ActionButton>
      </header>

      <label className="community-spoiler-toggle">
        <input
          checked={hideSpoilers}
          onChange={(event) => {
            setHideSpoilers(event.target.checked)
            setRevealedDiscussions([])
          }}
          type="checkbox"
        />
        <span>Hide story spoilers</span>
      </label>

      <div className="community-layout">
        <section aria-labelledby="community-activity-title" className="community-panel community-activity">
          <h2 id="community-activity-title">My activity</h2>
          {myActivity.length > 0 ? (
            <ul>
              {myActivity.map((discussion) => {
                const { id, title } = discussion
                const replyCount = repliesByDiscussion[id]?.length ?? 0
                const details = [
                  localDiscussionIds.has(id) ? 'Your post' : '',
                  replyCount ? `${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}` : '',
                ].filter(Boolean).join(' · ')

                return (
                  <li key={id}>
                    <Link replace to={`?thread=${encodeURIComponent(id)}`}>
                      <GlitchContent>{isHidden(discussion) ? 'Hidden story discussion' : title}</GlitchContent>
                    </Link>
                    <span>{details}</span>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p>Your posts and the discussions you reply to will appear here.</p>
          )}
        </section>

        <section aria-label="Community discussions" className="discussion-list">
          {activeThread && !feed.some(({ id }) => id === activeThread) ? (
            <p role="status">This discussion isn’t available in this browser.</p>
          ) : null}
          {feed.map((discussion) => isHidden(discussion) ? (
            <article
              className="discussion-card discussion-card--spoiler"
              key={discussion.id}
              ref={activeThread === discussion.id ? activeSpoilerRef : undefined}
              tabIndex={-1}
            >
              <h2>Story spoilers</h2>
              <p className="discussion-card__excerpt">The title, post and replies are hidden.</p>
              <ActionButton
                onClick={() => setRevealedDiscussions((current) => [...current, discussion.id])}
                variant="secondary"
              >
                Reveal spoilers
              </ActionButton>
            </article>
          ) : (
            <DiscussionCard
              discussion={discussion}
              key={discussion.id}
              localReplies={repliesByDiscussion[discussion.id] ?? []}
              onCloseReply={() => setSearchParams({}, { replace: true })}
              onFeedback={showStatus}
              onOpenReply={() => setSearchParams({ thread: discussion.id }, { replace: true })}
              onParticipate={markParticipation}
              onReply={(reply) => saveReply(discussion.id, reply)}
              replyDialogOpen={activeThread === discussion.id}
            />
          ))}
        </section>

        <aside className="community-sidebar">
          <section className="community-panel community-panel--cyan">
            <h2>Trending</h2>
            <p># Phantom Liberty</p>
            <p># Favorite endings</p>
            <p># Best builds</p>
            <p># Night City photos</p>
          </section>
          <section className="community-panel community-panel--red">
            <h2>Community rules</h2>
            <p>01&nbsp;&nbsp; Respect other fans</p>
            <p>02&nbsp;&nbsp; Mark story spoilers</p>
            <p>03&nbsp;&nbsp; Keep discussions relevant</p>
          </section>
        </aside>
      </div>

      <PageMarker index="04" label="Community" />
      <InteractionStatus status={status} />

      <dialog className="discussion-dialog" ref={dialogRef}>
        <form onSubmit={handleSubmit}>
          <div className="discussion-dialog__heading">
            <div>
              <p className="dialog-kicker">New transmission</p>
              <h2>Start a discussion</h2>
            </div>
            <button
              aria-label="Close discussion form"
              className="dialog-close"
              onClick={() => dialogRef.current?.close()}
              type="button"
            >
              <GlitchContent>Close</GlitchContent>
            </button>
          </div>
          <p className="discussion-dialog__note">
            This prototype stores your post only in this browser.
          </p>
          <label htmlFor="discussion-title">Title</label>
          <input
            id="discussion-title"
            maxLength={80}
            name="title"
            placeholder="What is on your mind?"
            required
          />
          <label htmlFor="discussion-message">Message</label>
          <textarea
            id="discussion-message"
            maxLength={360}
            name="message"
            placeholder="Share your take with the community..."
            required
            rows={6}
          />
          <label className="discussion-dialog__spoiler">
            <input name="spoiler" type="checkbox" />
            <span>Contains story spoilers</span>
          </label>
          <div className="discussion-dialog__actions">
            <button
              className="button button--secondary"
              onClick={() => dialogRef.current?.close()}
              type="button"
            >
              <GlitchContent>Cancel</GlitchContent>
            </button>
            <button className="button button--primary" type="submit">
              <GlitchContent>Post locally</GlitchContent>
            </button>
          </div>
        </form>
      </dialog>
    </div>
  )
}
