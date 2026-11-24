import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ActionButton } from '../../components/Button/Button'
import { GlitchContent } from '../../components/Button/GlitchContent'
import { DiscussionCard } from '../../components/DiscussionCard/DiscussionCard'
import { InteractionStatus } from '../../components/InteractionStatus/InteractionStatus'
import { PageMarker } from '../../components/PageMarker/PageMarker'
import type { Discussion } from '../../../shared/community'
import { useCommunity } from '../../api/communityContext'
import { errorMessage } from '../../api/transport'
import { useTransientStatus } from '../../hooks/useTransientStatus'

function isDiscussionBackdrop(event: MouseEvent<HTMLDialogElement>) {
  if (event.target !== event.currentTarget) return false
  const { left, right, top, bottom } = event.currentTarget.getBoundingClientRect()
  return event.clientX < left || event.clientX >= right || event.clientY < top || event.clientY >= bottom
}

export function Community() {
  const { site: { profile, discussions: feed }, mutate } = useCommunity()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const pressedBackdrop = useRef(false)
  const activeSpoilerRef = useRef<HTMLElement>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const activeThread = searchParams.get('thread')
  const [guestHideSpoilers, setGuestHideSpoilers] = useState(true)
  const hideSpoilers = profile?.hideSpoilers ?? guestHideSpoilers
  const [revealedDiscussions, setRevealedDiscussions] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const [submissionError, setSubmissionError] = useState('')
  const { status, showStatus } = useTransientStatus()
  const myActivity = feed.filter(({ myActivity }) => myActivity)
  const isHidden = (discussion: Discussion) =>
    hideSpoilers && discussion.spoiler && !revealedDiscussions.includes(discussion.id)
  const hiddenActive = feed.some((discussion) => discussion.id === activeThread && isHidden(discussion))

  useEffect(() => {
    if (hiddenActive) activeSpoilerRef.current?.focus()
  }, [activeThread, hiddenActive])

  const setHideSpoilers = async (hidden: boolean) => {
    try {
      if (profile) await mutate('spoilers', { hidden }, 'site')
      else setGuestHideSpoilers(hidden)
      setRevealedDiscussions([])
    } catch (error) {
      showStatus(errorMessage(error))
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (sending) return
    const form = event.currentTarget
    const formData = new FormData(form)
    const title = String(formData.get('title') ?? '').trim()
    const excerpt = String(formData.get('message') ?? '').trim()

    if (!title || !excerpt) return

    setSending(true)
    setSubmissionError('')
    try {
      await mutate('discussion', { title, text: excerpt, spoiler: formData.get('spoiler') === 'on' }, 'site')
      form.reset()
      dialogRef.current?.close()
      showStatus('Post published to Community')
    } catch (error) {
      setSubmissionError(errorMessage(error))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="figma-page figma-page--community">
      <header className="page-title community-heading">
        <div className="community-heading__copy">
          <h1 className="glitch-heading glitch-heading--yellow">Community</h1>
          <p>Share your take and discover what other fans are discussing.</p>
        </div>
        <ActionButton onClick={() => {
          if (profile) dialogRef.current?.showModal()
          else showStatus('Log in to start a discussion.')
        }}>
          + New post
        </ActionButton>
      </header>

      <label className="community-spoiler-toggle">
        <input
          checked={hideSpoilers}
          onChange={(event) => void setHideSpoilers(event.target.checked)}
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
                const details = discussion.mine ? 'Your post' : 'You replied'

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
            <p role="status">This discussion isn’t available.</p>
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
              onCloseReply={() => setSearchParams({}, { replace: true })}
              onFeedback={showStatus}
              onOpenReply={() => setSearchParams({ thread: discussion.id }, { replace: true })}
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

      <dialog
        aria-labelledby="new-discussion-title"
        className="discussion-dialog"
        onClick={(event) => {
          if (pressedBackdrop.current && isDiscussionBackdrop(event)) event.currentTarget.close()
          pressedBackdrop.current = false
        }}
        onPointerDown={(event) => {
          pressedBackdrop.current = isDiscussionBackdrop(event)
        }}
        ref={dialogRef}
      >
        <form onSubmit={handleSubmit}>
          <div className="discussion-dialog__heading">
            <div>
              <p className="dialog-kicker">New transmission</p>
              <h2 id="new-discussion-title">Start a discussion</h2>
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
            Your post will be visible in Community.
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
            <button className="button button--primary" disabled={sending} type="submit">
              <GlitchContent>{sending ? 'Posting…' : 'Publish post'}</GlitchContent>
            </button>
          </div>
          {submissionError && <p role="alert">{submissionError}</p>}
        </form>
      </dialog>
    </div>
  )
}
