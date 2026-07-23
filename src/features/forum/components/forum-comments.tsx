import Link from "next/link";
import { createForumCommentAction } from "../actions";
import { formatForumDate } from "../format";
import type { ForumComment } from "../types";
import { VoteControls } from "./vote-controls";

type ForumCommentsProps = {
  authenticated: boolean;
  comments: ForumComment[];
  postId: string;
};

export function ForumComments({
  authenticated,
  comments,
  postId,
}: ForumCommentsProps) {
  const topLevel = comments.filter((comment) => !comment.parent_id);
  const replies = new Map<string, ForumComment[]>();

  comments.forEach((comment) => {
    if (!comment.parent_id) return;
    const existing = replies.get(comment.parent_id) ?? [];
    existing.push(comment);
    replies.set(comment.parent_id, existing);
  });

  return (
    <section className="forum-comments" id="kommentarer">
      <div className="forum-comments__heading">
        <div>
          <p className="eyebrow">Samtalen</p>
          <h2>{comments.length} svar</h2>
        </div>
      </div>

      {authenticated ? (
        <form
          action={createForumCommentAction.bind(null, postId)}
          className="comment-form"
        >
          <label htmlFor="new-comment">Skriv et svar</label>
          <textarea
            id="new-comment"
            maxLength={5_000}
            minLength={2}
            name="body"
            placeholder="Del din erfaring eller stil et opklarende spørgsmål."
            required
            rows={5}
          />
          <button className="button button--dark" type="submit">
            Tilføj svar
          </button>
        </form>
      ) : (
        <div className="forum-login-callout">
          <p>Log ind for at deltage i samtalen og stemme.</p>
          <Link className="button button--dark" href="/auth/log-ind">
            Log ind
          </Link>
        </div>
      )}

      {topLevel.length ? (
        <div className="comment-list">
          {topLevel.map((comment) => (
            <article className="forum-comment" key={comment.id}>
              <VoteControls
                authenticated={authenticated}
                commentId={comment.id}
                currentVote={comment.current_vote}
                postId={postId}
                score={comment.score}
              />
              <div className="forum-comment__body">
                <p className="forum-comment__meta">
                  <strong>{comment.author_name}</strong>
                  <span>{formatForumDate(comment.created_at)}</span>
                </p>
                <p className="forum-comment__text">{comment.body}</p>
                {authenticated && (
                  <details className="reply-box">
                    <summary>Svar</summary>
                    <form action={createForumCommentAction.bind(null, postId)}>
                      <input name="parentId" type="hidden" value={comment.id} />
                      <textarea
                        aria-label={`Svar ${comment.author_name}`}
                        maxLength={5_000}
                        minLength={2}
                        name="body"
                        required
                        rows={3}
                      />
                      <button className="button button--quiet" type="submit">
                        Send svar
                      </button>
                    </form>
                  </details>
                )}

                {(replies.get(comment.id) ?? []).map((reply) => (
                  <article className="forum-comment forum-comment--reply" key={reply.id}>
                    <VoteControls
                      authenticated={authenticated}
                      commentId={reply.id}
                      currentVote={reply.current_vote}
                      postId={postId}
                      score={reply.score}
                    />
                    <div className="forum-comment__body">
                      <p className="forum-comment__meta">
                        <strong>{reply.author_name}</strong>
                        <span>{formatForumDate(reply.created_at)}</span>
                      </p>
                      <p className="forum-comment__text">{reply.body}</p>
                    </div>
                  </article>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="forum-comments__empty">Der er ingen svar endnu.</p>
      )}
    </section>
  );
}
