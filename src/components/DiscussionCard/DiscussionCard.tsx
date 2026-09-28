import { useRef, useState, type FormEvent, type MouseEvent } from 'react'
import type { Discussion } from '../../data/discussions'
import { useLocalStorage } from '../../hooks/useLocalStorage'

interface DiscussionCardProps {
  discussion: Discussion
  variant?: 'feed' | 'trending'
  onFeedback?: (message: string) => void
  onParticipate?: () => void
}

export function DiscussionCard({
  discussion,
  variant = 'feed',
  onFeedback,
  onParticipate,
}: DiscussionCardProps) {
  const [liked, setLiked] = useLocalStorage(
    `cyberpunk:reaction:discussion:${discussion.id}`,
    false,
  )
  const [localReplies, setLocalReplies] = useLocalStorage<string[]>(
    `cyberpunk:discussion-replies:${discussion.id}`,
    [],
  )
  const replyDialogRef = useRef<HTMLDialogElement>(null)
  const replyInputRef = useRef<HTMLInputElement>(null)
  const [replyDialogOpen, setReplyDialogOpen] = useState(false)
  const [replyDraft, setReplyDraft] = useState('')
  const likes = discussion.likes + Number(liked)
  const replies = discussion.replies + localReplies.length
  const replyDialogId = `reply-dialog-${discussion.id}`

  const openReplyDialog = () => {
    const dialog = replyDialogRef.current

    if (!dialog || dialog.open) return

    dialog.showModal()
    setReplyDialogOpen(true)
    window.requestAnimationFrame(() => replyInputRef.current?.focus())
  }

  const closeReplyDialog = () => {
    const dialog = replyDialogRef.current

    if (dialog?.open) dialog.close()
    setReplyDialogOpen(false)
  }

  const handleDialogBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) closeReplyDialog()
  }

  const handleReply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const reply = replyDraft.trim()
    if (!reply) return

    setLocalReplies((current) => [...current, reply])
    setReplyDraft('')
    onParticipate?.()
    onFeedback?.('Reply saved on this device')
  }

  const handleLike = () => {
    const nextLiked = !liked
    setLiked(nextLiked)

    if (nextLiked) {
      onParticipate?.()
    }

    onFeedback?.(
      nextLiked
        ? 'Discussion liked on this device'
        : 'Discussion like removed',
    )
  }

  return (
    <>
      <article
        className={`discussion-card discussion-card--${discussion.accent ?? 'cyan'} discussion-card--${variant}`}
      >
        <p className="discussion-card__author">
          @{discussion.author}
          {variant === 'trending' ? <span> · {discussion.time}</span> : null}
        </p>
        {variant === 'trending' ? (
          <p className="discussion-card__text">{discussion.excerpt}</p>
        ) : (
          <>
            <h2>{discussion.title}</h2>
            <p className="discussion-card__excerpt">
              {discussion.excerpt}
            </p>
          </>
        )}
        <div className="discussion-card__actions">
          <button
            aria-label={`${liked ? 'Unlike' : 'Like'} discussion. ${likes} likes`}
            aria-pressed={liked}
            className={liked ? 'is-active' : undefined}
            onClick={handleLike}
            type="button"
          >
            <span aria-hidden="true">♥</span> {likes}
          </button>
          <button
            aria-controls={replyDialogId}
            aria-expanded={replyDialogOpen}
            className="discussion-card__reply-toggle"
            onClick={openReplyDialog}
            type="button"
          >
            {variant === 'trending' ? 'Reply' : 'Replies'} {replies}
          </button>
        </div>
      </article>

      <dialog
        aria-describedby={`${replyDialogId}-description`}
        aria-labelledby={`${replyDialogId}-title`}
        className="reply-dialog"
        id={replyDialogId}
        onCancel={() => setReplyDialogOpen(false)}
        onClick={handleDialogBackdrop}
        onClose={() => setReplyDialogOpen(false)}
        ref={replyDialogRef}
      >
        <div className="reply-dialog__content">
          <header className="reply-dialog__heading">
            <h2 id={`${replyDialogId}-title`}>Community / Reply open</h2>
            <button
              aria-label="Close reply dialog"
              className="reply-dialog__close"
              onClick={closeReplyDialog}
              type="button"
            >
              Close
            </button>
          </header>
          <p
            className="reply-dialog__description"
            id={`${replyDialogId}-description`}
          >
            {localReplies.length > 0
              ? 'Expanded reply composer with a browser-local saved reply.'
              : 'Expanded reply composer. Replies are stored only in this browser.'}
          </p>

          <section
            aria-label={`Reply to ${discussion.title}`}
            className="reply-dialog__discussion"
          >
            <p className="reply-dialog__author">@{discussion.author}</p>
            <h3 className="reply-dialog__title">{discussion.title}</h3>
            <p className="reply-dialog__metrics">
              <span aria-hidden="true">♥</span> {likes} &nbsp; Replies {replies}
            </p>

            {localReplies.length > 0 ? (
              <ul
                aria-label="Replies saved in this browser"
                className="reply-dialog__replies"
              >
                {localReplies.map((reply, index) => (
                  <li key={`${discussion.id}-reply-${index}`}>
                    <strong>@local_merc</strong>
                    <span>{reply}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            <form className="reply-dialog__form" onSubmit={handleReply}>
              <label
                className="visually-hidden"
                htmlFor={`reply-${discussion.id}`}
              >
                Reply to {discussion.title}
              </label>
              <input
                id={`reply-${discussion.id}`}
                maxLength={240}
                onChange={(event) => setReplyDraft(event.target.value)}
                placeholder="Write a local reply..."
                ref={replyInputRef}
                required
                value={replyDraft}
              />
              <button type="submit">Send</button>
            </form>
          </section>
        </div>
      </dialog>
    </>
  )
}
