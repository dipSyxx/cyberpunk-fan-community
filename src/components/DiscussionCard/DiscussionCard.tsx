import type { Discussion } from '../../data/discussions'
import { ReactionButton } from '../ReactionButton/ReactionButton'

interface DiscussionCardProps {
  discussion: Discussion
}

export function DiscussionCard({ discussion }: DiscussionCardProps) {
  return (
    <article className="discussion-card">
      <div className="discussion-card__meta">
        <span>{discussion.tag}</span>
        <span>{discussion.time}</span>
      </div>
      <h2>{discussion.title}</h2>
      <p>{discussion.excerpt}</p>
      <div className="discussion-card__footer">
        <span className="discussion-card__author">@{discussion.author}</span>
        <div className="discussion-card__actions">
          <span className="reply-count">↳ {discussion.replies} replies</span>
          <ReactionButton
            activeLabel="Liked"
            initialCount={discussion.likes}
            label="Like"
            storageKey={`discussion:${discussion.id}`}
          />
        </div>
      </div>
    </article>
  )
}
