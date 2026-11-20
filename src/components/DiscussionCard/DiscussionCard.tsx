import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from 'react'
import type { Discussion } from '../../data/discussions'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { GlitchContent } from '../Button/GlitchContent'

interface DiscussionCardProps {
  discussion: Discussion
  localReplies: string[]
  replyDialogOpen: boolean
  variant?: 'feed' | 'trending'
  onCloseReply: () => void
  onFeedback?: (message: string) => void
  onOpenReply: () => void
  onParticipate?: () => void
  onReply: (reply: string) => boolean
}

export function DiscussionCard({
  discussion,
  localReplies,
  replyDialogOpen,
  variant = 'feed',
  onCloseReply,
  onFeedback,
  onOpenReply,
  onParticipate,
  onReply,
}: DiscussionCardProps) {
  const [liked, setLiked] = useLocalStorage(
    `cyberpunk:reaction:discussion:${discussion.id}`,
    false,
  )
  const replyButtonRef = useRef<HTMLButtonElement>(null)
  const replyDialogRef = useRef<HTMLDialogElement>(null)
  const replyInputRef = useRef<HTMLInputElement>(null)
  const [replyDraft, setReplyDraft] = useState('')
  const [replyStatus, setReplyStatus] = useState<'saved' | 'error' | null>(null)
  const likes = discussion.likes + Number(liked)
  const replyCountLabel = `${localReplies.length} local ${localReplies.length === 1 ? 'reply' : 'replies'}`
  const replyDialogId = `reply-dialog-${discussion.id}`

  useEffect(() => {
    const dialog = replyDialogRef.current
    if (!replyDialogOpen || !dialog) return

    const opener = document.activeElement
    const replyButton = replyButtonRef.current
    setReplyStatus(null)
    dialog.showModal()
    replyInputRef.current?.focus()

    return () => {
      dialog.close()
      if (opener === document.body || !opener?.isConnected) {
        replyButton?.focus()
      }
    }
  }, [replyDialogOpen])

  const handleDialogBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) onCloseReply()
  }

  const handleReply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const reply = replyDraft.trim()
    if (!reply) return

    const saved = onReply(reply)
    if (saved) setReplyDraft('')
    setReplyStatus(saved ? 'saved' : 'error')
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
            <GlitchContent><span aria-hidden="true">♥</span> {likes}</GlitchContent>
          </button>
          <button
            aria-controls={replyDialogId}
            aria-expanded={replyDialogOpen}
            className="discussion-card__reply-toggle"
            onClick={onOpenReply}
            ref={replyButtonRef}
            type="button"
          >
            <GlitchContent>Reply · {replyCountLabel}</GlitchContent>
          </button>
        </div>
      </article>

      <dialog
        aria-describedby={`${replyDialogId}-description`}
        aria-labelledby={`${replyDialogId}-title`}
        className="reply-dialog"
        id={replyDialogId}
        onCancel={(event) => {
          event.preventDefault()
          onCloseReply()
        }}
        onClick={handleDialogBackdrop}
        ref={replyDialogRef}
      >
        <div className="reply-dialog__content">
          <header className="reply-dialog__heading">
            <h2 id={`${replyDialogId}-title`}>Community / Reply open</h2>
            <button
              aria-label="Close reply dialog"
              className="reply-dialog__close"
              onClick={onCloseReply}
              type="button"
            >
              <GlitchContent>Close</GlitchContent>
            </button>
          </header>
          <p
            className="reply-dialog__description"
            id={`${replyDialogId}-description`}
          >
            Replies are stored only in this browser.
          </p>

          <section
            aria-label={`Reply to ${discussion.title}`}
            className="reply-dialog__discussion"
          >
            <p className="reply-dialog__author">@{discussion.author}</p>
            <h3 className="reply-dialog__title">{discussion.title}</h3>
            <p className="reply-dialog__excerpt">{discussion.excerpt}</p>
            <p className="reply-dialog__metrics">
              <span aria-hidden="true">♥</span> {likes} &nbsp; {replyCountLabel}
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
                onChange={(event) => {
                  setReplyDraft(event.target.value)
                  setReplyStatus(null)
                }}
                placeholder="Write a local reply..."
                ref={replyInputRef}
                required
                value={replyDraft}
              />
              <button type="submit"><GlitchContent>Send</GlitchContent></button>
              <p className="reply-dialog__status" role="status">
                {replyStatus === 'saved' && 'Reply saved in this browser.'}
                {replyStatus === 'error' && 'Could not save your reply. Try again.'}
              </p>
            </form>
          </section>
        </div>
      </dialog>
    </>
  )
}
