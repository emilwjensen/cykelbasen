import Link from "next/link";
import { ForumPostForm } from "@/features/forum/components/forum-post-form";
import { createForumPostAction } from "@/features/forum/actions";
import { getForumCategories } from "@/features/forum/queries";
import { getProfile } from "@/features/profiles/queries";
import { requireUser } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type NewForumPostPageProps = {
  searchParams: Promise<{ kategori?: string }>;
};

export default async function NewForumPostPage({
  searchParams,
}: NewForumPostPageProps) {
  const [user, params, categories] = await Promise.all([
    requireUser(),
    searchParams,
    getForumCategories(),
  ]);
  const profile = await getProfile(user.id);
  if (!profile) redirect("/profil?ny=1");

  const categorySlug = categories.some(
    (category) => category.slug === params.kategori,
  )
    ? params.kategori
    : undefined;

  return (
    <div className="editor-page shell">
      <Link className="back-link" href="/forum">
        <span aria-hidden="true">←</span> Forum
      </Link>
      <header className="editor-heading">
        <p className="eyebrow">Nyt forumindlæg</p>
        <h1>Giv samtalen en god start.</h1>
        <p>
          Vælg en tydelig kategori, og tilføj den kontekst andre skal bruge for
          at kunne hjælpe.
        </p>
      </header>
      <ForumPostForm
        action={createForumPostAction}
        categories={categories}
        initialValues={{ categorySlug }}
        submitLabel="Udgiv indlæg"
      />
    </div>
  );
}
