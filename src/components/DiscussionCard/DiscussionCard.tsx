import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { Discussion, Reply } from '../../../shared/community'
import { useCommunity, useResource } from '../../api/communityContext'
import { errorMessage } from '../../api/transport'
import { GlitchContent } from '../Button/GlitchContent'

interface DiscussionCardProps {
  discussion: Discussion
  replyDialogOpen: boolean
  onCloseReply: () => void
  onFeedback: (message: string) => void
  onOpenReply: () => void
}

export function DiscussionCard({ discussion, replyDialogOpen, onCloseReply, onFeedback, onOpenReply }: DiscussionCardProps) {
  const { site: { profile }, mutate } = useCommunity()
  const replies = useResource<Reply[]>(replyDialogOpen ? `replies/${discussion.id}` : null)
  const { liked, likes } = discussion
  const replyButtonRef = useRef<HTMLButtonElement>(null)
  const replyDialogRef = useRef<HTMLDialogElement>(null)
  const replyInputRef = useRef<HTMLInputElement>(null)
  const [replyDraft, setReplyDraft] = useState('')
  const [replyStatus, setReplyStatus] = useState('')
  const [sending, setSending] = useState(false)
  const replyCountLabel = `${discussion.replies} ${discussion.replies === 1 ? 'reply' : 'replies'}`
  const replyDialogId = `reply-dialog-${discussion.id}`
  const replyCountId = `reply-count-${discussion.id}`

  useEffect(() => {
    const dialog = replyDialogRef.current
    if (!replyDialogOpen || !dialog) return
    const opener = document.activeElement
    const replyButton = replyButtonRef.current
    setReplyStatus('')
    dialog.showModal()
    replyInputRef.current?.focus()
    return () => {
      dialog.close()
      if (opener === document.body || !opener?.isConnected) replyButton?.focus()
    }
  }, [replyDialogOpen])

  const handleReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const reply = replyDraft.trim()
    if (!reply || sending) return
    setSending(true)
    try {
      await mutate('reply', { discussionId: discussion.id, text: reply }, 'all')
      setReplyDraft('')
      setReplyStatus('Reply published.')
    } catch (error) {
      setReplyStatus(errorMessage(error))
    } finally {
      setSending(false)
    }
  }

  const handleLike = async () => {
    try {
      await mutate('like', { id: discussion.id, selected: !liked }, 'site')
      onFeedback(liked ? 'Discussion like removed' : 'Discussion liked')
    } catch (error) {
      onFeedback(errorMessage(error))
    }
  }

  return (
    <>
      <article className={`discussion-card discussion-card--${discussion.accent} discussion-card--feed`}>
        <p className="discussion-card__author">@{discussion.author}</p>
        <h2>{discussion.title}</h2>
        <p className="discussion-card__excerpt">{discussion.excerpt}</p>
        <div className="discussion-card__actions">
          <button aria-label={`${liked ? 'Unlike' : 'Like'} discussion. ${likes} likes`} aria-pressed={liked}
            className={liked ? 'is-active' : undefined} onClick={() => void handleLike()} type="button">
            <GlitchContent><span aria-hidden="true">♥</span> {likes}</GlitchContent>
          </button>
          <button aria-controls={replyDialogId} aria-describedby={replyCountId} aria-expanded={replyDialogOpen} aria-haspopup="dialog"
            className="discussion-card__reply-toggle" onClick={onOpenReply} ref={replyButtonRef} type="button">
            <GlitchContent>Reply</GlitchContent>
          </button>
          <span className="discussion-card__reply-count" id={replyCountId}>{replyCountLabel}</span>
        </div>
      </article>
      <dialog aria-describedby={`${replyDialogId}-description`} aria-labelledby={`${replyDialogId}-title`} className="reply-dialog"
        id={replyDialogId} ref={replyDialogRef}
        onCancel={(event) => { event.preventDefault(); onCloseReply() }}
        onClick={(event) => { if (event.target === event.currentTarget) onCloseReply() }}>
        <div className="reply-dialog__content">
          <header className="reply-dialog__heading">
            <h2 id={`${replyDialogId}-title`}>Community / Reply open</h2>
            <button aria-label="Close reply dialog" className="dialog-close" onClick={onCloseReply} type="button"><GlitchContent>Close</GlitchContent></button>
          </header>
          <p className="reply-dialog__description" id={`${replyDialogId}-description`}>{profile ? 'Replies are public.' : 'Log in to reply.'}</p>
          <section aria-label={`Reply to ${discussion.title}`} className="reply-dialog__discussion">
            <p className="reply-dialog__author">@{discussion.author}</p>
            <h3 className="reply-dialog__title">{discussion.title}</h3>
            <p className="reply-dialog__excerpt">{discussion.excerpt}</p>
            <p className="reply-dialog__metrics"><span aria-hidden="true">♥</span> {likes} &nbsp; {replyCountLabel}</p>
          </section>
          {replies.loading && <p role="status">Loading replies…</p>}
          {replies.error && <p role="alert">{replies.error.message} <button type="button" onClick={replies.retry}>Retry</button></p>}
          {Boolean(replies.value?.length) && (
            <ul aria-label="Replies" className="reply-dialog__replies">
              {replies.value?.map((reply) => <li key={reply.id}><strong>@{reply.author}</strong><span>{reply.text}</span></li>)}
            </ul>
          )}
          {profile && <form className="reply-dialog__form" onSubmit={(event) => void handleReply(event)}>
            <label className="visually-hidden" htmlFor={`reply-${discussion.id}`}>Reply to {discussion.title}</label>
            <input id={`reply-${discussion.id}`} maxLength={240} onChange={(event) => { setReplyDraft(event.target.value); setReplyStatus('') }}
              placeholder="Write a reply..." ref={replyInputRef} required value={replyDraft} />
            <button disabled={sending} type="submit"><GlitchContent>Send</GlitchContent></button>
            <p className="reply-dialog__status" role="status">{replyStatus}</p>
          </form>}
        </div>
      </dialog>
    </>
  )
}
