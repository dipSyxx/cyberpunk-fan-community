import { useRef, type FormEvent } from 'react'
import { ActionButton } from '../../components/Button/Button'
import { DiscussionCard } from '../../components/DiscussionCard/DiscussionCard'
import { InteractionStatus } from '../../components/InteractionStatus/InteractionStatus'
import { PageMarker } from '../../components/PageMarker/PageMarker'
import { discussions, type Discussion } from '../../data/discussions'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { useTransientStatus } from '../../hooks/useTransientStatus'

interface LocalDiscussion extends Discussion {
  createdLocally: true
}

export function Community() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [localDiscussions, setLocalDiscussions] = useLocalStorage<
    LocalDiscussion[]
  >('cyberpunk:local-discussions', [])
  const [, setHasParticipated] = useLocalStorage<boolean>(
    'cyberpunk:community-participated',
    false,
  )
  const { status, showStatus } = useTransientStatus()
  const markParticipation = () => setHasParticipated(true)

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

      <div className="community-layout">
        <section aria-label="Community discussions" className="discussion-list">
          {[...localDiscussions, ...discussions].map((discussion) => (
            <DiscussionCard
              discussion={discussion}
              key={discussion.id}
              onFeedback={showStatus}
              onParticipate={markParticipation}
            />
          ))}
        </section>

        <aside className="community-sidebar">
          <section className="community-panel community-panel--yellow">
            <h2>Your local activity</h2>
            <p className="community-panel__primary">
              {localDiscussions.length} local{' '}
              {localDiscussions.length === 1 ? 'post' : 'posts'}
            </p>
            <p>Saved only on this device</p>
            <p className="community-panel__online">No account required</p>
          </section>
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
              Close
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
