import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { updateForumPostAction } from "@/features/forum/actions";
import { ForumPostForm } from "@/features/forum/components/forum-post-form";
import {
  getEditableForumPost,
  getForumCategories,
} from "@/features/forum/queries";
import { requireUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

type EditForumPostPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditForumPostPage({
  params,
}: EditForumPostPageProps) {
  const [{ id }, user, categories] = await Promise.all([
    params,
    requireUser(),
    getForumCategories(),
  ]);
  if (!z.string().uuid().safeParse(id).success) notFound();

  const post = await getEditableForumPost(id, user.id);
  if (!post) notFound();

  return (
    <div className="editor-page shell">
      <Link className="back-link" href={`/forum/indlaeg/${post.id}`}>
        <span aria-hidden="true">←</span> Tilbage til indlægget
      </Link>
      <header className="editor-heading">
        <p className="eyebrow">Redigér forumindlæg</p>
        <h1>Gør spørgsmålet tydeligere.</h1>
        <p>Ændringer vises med det samme i forum.</p>
      </header>
      <ForumPostForm
        action={updateForumPostAction.bind(null, post.id)}
        categories={categories}
        initialValues={{
          body: post.body,
          categorySlug: post.category_slug,
          title: post.title,
        }}
        submitLabel="Gem ændringer"
      />
    </div>
  );
}
