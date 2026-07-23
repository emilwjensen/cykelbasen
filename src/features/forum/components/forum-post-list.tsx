import Link from "next/link";
import { formatForumDate } from "../format";
import type { ForumPostSummary } from "../types";

export function ForumPostList({ posts }: { posts: ForumPostSummary[] }) {
  if (!posts.length) {
    return (
      <div className="empty-state forum-empty">
        <p className="eyebrow">Ingen indlæg endnu</p>
        <h2>Start den første samtale.</h2>
        <p>Et konkret spørgsmål gør det lettere for andre at hjælpe.</p>
        <Link className="button button--dark" href="/forum/nyt">
          Opret indlæg
        </Link>
      </div>
    );
  }

  return (
    <div className="forum-post-list">
      {posts.map((post) => (
        <article className="forum-post-row" key={post.id}>
          <div className="forum-post-row__score">
            <strong>{post.score}</strong>
            <span>point</span>
          </div>
          <div className="forum-post-row__main">
            <div className="forum-post-row__meta">
              <Link href={`/forum/${post.category_slug}`}>
                {post.category_name}
              </Link>
              <span>
                {post.author_name} · {formatForumDate(post.created_at)}
              </span>
            </div>
            <h2>
              <Link href={`/forum/indlaeg/${post.id}`}>{post.title}</Link>
            </h2>
            <p>{post.body}</p>
          </div>
          <Link
            aria-label={`${post.comment_count} kommentarer til ${post.title}`}
            className="forum-post-row__comments"
            href={`/forum/indlaeg/${post.id}#kommentarer`}
          >
            <strong>{post.comment_count}</strong>
            <span>svar</span>
          </Link>
        </article>
      ))}
    </div>
  );
}
