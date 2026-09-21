import { useRef } from 'react'
import { ActionButton } from '../../components/Button/Button'
import { DiscussionCard } from '../../components/DiscussionCard/DiscussionCard'
import { discussions, type Discussion } from '../../data/discussions'
import { useLocalStorage } from '../../hooks/useLocalStorage'

interface LocalDiscussion extends Discussion {
  createdLocally: true
}

export function Community() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [localDiscussions, setLocalDiscussions] = useLocalStorage<
    LocalDiscussion[]
  >('cyberpunk:local-discussions', [])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
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
        createdLocally: true,
      },
      ...current,
    ])

    form.reset()
    dialogRef.current?.close()
  }

  return (
    <div className="page-shell content-shell">
      <header className="community-intro">
        <div>
          <p className="eyebrow">Afterlife terminal // Live</p>
          <h1>Community feed</h1>
          <p>
            Trade theories, compare builds, and share the Night City stories
            that still live rent-free in your chrome.
          </p>
        </div>
        <ActionButton onClick={() => dialogRef.current?.showModal()}>
          <span aria-hidden="true">＋</span> Start discussion
        </ActionButton>
      </header>

      <div className="community-stats" aria-label="Community statistics">
        <p>
          <strong>12.8K</strong>
          <span>Mercs online</span>
        </p>
        <p>
          <strong>{discussions.length + localDiscussions.length}</strong>
          <span>Active threads</span>
        </p>
        <p>
          <strong>NC</strong>
          <span>Local time 02:17</span>
        </p>
      </div>

      <section aria-label="Community discussions" className="discussion-list">
        {[...localDiscussions, ...discussions].map((discussion) => (
          <DiscussionCard discussion={discussion} key={discussion.id} />
        ))}
      </section>

      <dialog className="discussion-dialog" ref={dialogRef}>
        <form onSubmit={handleSubmit}>
          <div className="discussion-dialog__heading">
            <div>
              <p className="eyebrow">New transmission</p>
              <h2>Start a discussion</h2>
            </div>
            <button
              aria-label="Close discussion form"
              className="icon-button"
              onClick={() => dialogRef.current?.close()}
              type="button"
            >
              <span aria-hidden="true">×</span>
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
          <div className="discussion-dialog__actions">
            <button
              className="button button--secondary"
              onClick={() => dialogRef.current?.close()}
              type="button"
            >
              Cancel
            </button>
            <button className="button button--primary" type="submit">
              Post locally
            </button>
          </div>
        </form>
      </dialog>
    </div>
  )
}
