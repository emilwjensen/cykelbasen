import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ForumComments } from "@/features/forum/components/forum-comments";
import { ReportForm } from "@/features/forum/components/report-form";
import { VoteControls } from "@/features/forum/components/vote-controls";
import { formatForumDate } from "@/features/forum/format";
import { getForumPost } from "@/features/forum/queries";
import { getCurrentUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

type ForumPostPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    fejl?: string;
    kommenteret?: string;
    rapport?: string;
  }>;
};

export default async function ForumPostPage({
  params,
  searchParams,
}: ForumPostPageProps) {
  const [{ id }, query, user] = await Promise.all([
    params,
    searchParams,
    getCurrentUser(),
  ]);
  if (!z.string().uuid().safeParse(id).success) notFound();

  const { post, comments } = await getForumPost(id, user?.id);
  if (!post) notFound();

  return (
    <div className="forum-detail shell">
      <Link className="back-link" href={`/forum/${post.category_slug}`}>
        ← {post.category_name}
      </Link>

      <article className="forum-post-detail">
        <VoteControls
          authenticated={Boolean(user)}
          currentVote={post.current_vote}
          postId={post.id}
          score={post.score}
        />
        <div className="forum-post-detail__main">
          <div className="forum-post-detail__meta">
            <Link href={`/forum/${post.category_slug}`}>{post.category_name}</Link>
            <span>
              {post.author_name} · {formatForumDate(post.created_at)}
            </span>
          </div>
          <h1>{post.title}</h1>
          <p className="forum-post-detail__body">{post.body}</p>
          {user?.id === post.author_id && (
            <Link
              className="text-link"
              href={`/forum/indlaeg/${post.id}/rediger`}
            >
              Redigér indlæg <span aria-hidden="true">→</span>
            </Link>
          )}
          {user && user.id !== post.author_id && (
            <ReportForm
              postId={post.id}
              targetId={post.id}
              targetType="post"
            />
          )}
        </div>
      </article>

      {query.fejl && (
        <p className="form-message form-message--error">
          Kommentaren kunne ikke gemmes. Kontrollér teksten og prøv igen.
        </p>
      )}
      {query.kommenteret && (
        <p className="form-message form-message--success">Dit svar er tilføjet.</p>
      )}
      {query.rapport === "sendt" && (
        <p className="form-message form-message--success">
          Tak. Rapporten er sendt til moderatorerne.
        </p>
      )}
      {query.rapport === "allerede" && (
        <p className="form-message">
          Du har allerede rapporteret dette indhold.
        </p>
      )}
      {(query.rapport === "ugyldig" || query.rapport === "fejl") && (
        <p className="form-message form-message--error">
          Rapporten kunne ikke sendes. Kontrollér felterne og prøv igen.
        </p>
      )}

      <ForumComments
        comments={comments}
        currentUserId={user?.id ?? null}
        postId={post.id}
      />
    </div>
  );
}
