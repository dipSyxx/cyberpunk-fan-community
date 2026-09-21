import type { Discussion } from '../../data/discussions'
import { useLocalStorage } from '../../hooks/useLocalStorage'

interface DiscussionCardProps {
  discussion: Discussion
  variant?: 'feed' | 'trending'
}

export function DiscussionCard({
  discussion,
  variant = 'feed',
}: DiscussionCardProps) {
  const [liked, setLiked] = useLocalStorage(
    `cyberpunk:reaction:discussion:${discussion.id}`,
    false,
  )
  const likes = discussion.likes + Number(liked)

  return (
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
          <p className="discussion-card__excerpt desktop-only">
            {discussion.excerpt}
          </p>
        </>
      )}
      <div className="discussion-card__actions mobile-only">
        <button
          aria-label={`${liked ? 'Unlike' : 'Like'} discussion. ${likes} likes`}
          aria-pressed={liked}
          className={liked ? 'is-active' : undefined}
          onClick={() => setLiked((current) => !current)}
          type="button"
        >
          <span aria-hidden="true">♥</span> {likes}
        </button>
        <span>
          {variant === 'trending' ? 'Reply' : 'Replies'} {discussion.replies}
        </span>
      </div>
      {variant === 'feed' ? (
        <p className="discussion-card__desktop-stats desktop-only">
          {likes} likes · {discussion.replies} replies
        </p>
      ) : null}
    </article>
  )
}
