import { useState, type FormEvent } from 'react'
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
  const [replyEditorOpen, setReplyEditorOpen] = useState(false)
  const [replyDraft, setReplyDraft] = useState('')
  const likes = discussion.likes + Number(liked)
  const replies = discussion.replies + localReplies.length

  const handleReply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const reply = replyDraft.trim()
    if (!reply) return

    setLocalReplies((current) => [...current, reply])
    setReplyDraft('')
    setReplyEditorOpen(false)
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
    <article
      className={`discussion-card discussion-card--${discussion.accent ?? 'cyan'} discussion-card--${variant}${replyEditorOpen || localReplies.length ? ' has-reply-content' : ''}`}
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
          aria-expanded={replyEditorOpen}
          className="discussion-card__reply-toggle"
          onClick={() => setReplyEditorOpen((current) => !current)}
          type="button"
        >
          {variant === 'trending' ? 'Reply' : 'Replies'} {replies}
        </button>
      </div>
      {localReplies.length > 0 ? (
        <ul aria-label="Local replies" className="discussion-card__local-replies">
          {localReplies.map((reply, index) => (
            <li key={`${discussion.id}-reply-${index}`}>
              <strong>@local_merc</strong> {reply}
            </li>
          ))}
        </ul>
      ) : null}
      {replyEditorOpen ? (
        <form className="discussion-card__reply-form" onSubmit={handleReply}>
          <label className="visually-hidden" htmlFor={`reply-${discussion.id}`}>
            Reply to {discussion.title}
          </label>
          <input
            id={`reply-${discussion.id}`}
            maxLength={240}
            onChange={(event) => setReplyDraft(event.target.value)}
            placeholder="Write a local reply..."
            required
            value={replyDraft}
          />
          <button type="submit">Send</button>
        </form>
      ) : null}
    </article>
  )
}
