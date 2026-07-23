import {
  voteForumCommentAction,
  voteForumPostAction,
} from "../actions";

type VoteControlsProps = {
  authenticated: boolean;
  currentVote: -1 | 0 | 1;
  score: number;
  postId: string;
  commentId?: string;
};

export function VoteControls({
  authenticated,
  currentVote,
  score,
  postId,
  commentId,
}: VoteControlsProps) {
  const upvote = commentId
    ? voteForumCommentAction.bind(null, postId, commentId, 1)
    : voteForumPostAction.bind(null, postId, 1);
  const downvote = commentId
    ? voteForumCommentAction.bind(null, postId, commentId, -1)
    : voteForumPostAction.bind(null, postId, -1);

  return (
    <div aria-label="Stemmer" className="vote-controls">
      <form action={upvote}>
        <button
          aria-label="Stem op"
          className={currentVote === 1 ? "is-active" : undefined}
          disabled={!authenticated}
          title={authenticated ? "Stem op" : "Log ind for at stemme"}
          type="submit"
        >
          ↑
        </button>
      </form>
      <strong>{score}</strong>
      <form action={downvote}>
        <button
          aria-label="Stem ned"
          className={currentVote === -1 ? "is-active" : undefined}
          disabled={!authenticated}
          title={authenticated ? "Stem ned" : "Log ind for at stemme"}
          type="submit"
        >
          ↓
        </button>
      </form>
    </div>
  );
}
