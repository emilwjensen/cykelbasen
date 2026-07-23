import Link from "next/link";
import { notFound } from "next/navigation";
import { ForumPostList } from "@/features/forum/components/forum-post-list";
import { getForumCategory, getForumPosts } from "@/features/forum/queries";
import { parseForumSort } from "@/features/forum/schema";

export const dynamic = "force-dynamic";

type CategoryPageProps = {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ sort?: string | string[] }>;
};

export default async function ForumCategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const [{ category: slug }, query] = await Promise.all([params, searchParams]);
  const sort = parseForumSort(query.sort);
  const [category, posts] = await Promise.all([
    getForumCategory(slug),
    getForumPosts({ categorySlug: slug, sort }),
  ]);

  if (!category) notFound();

  const basePath = `/forum/${category.slug}`;

  return (
    <div className="forum-page shell">
      <Link className="back-link" href="/forum">
        ← Alle kategorier
      </Link>
      <header className="forum-category-hero">
        <div>
          <p className="eyebrow">Forumkategori</p>
          <h1>{category.name}</h1>
          <p>{category.description}</p>
        </div>
        <Link
          className="button button--accent"
          href={`/forum/nyt?kategori=${category.slug}`}
        >
          Opret indlæg
        </Link>
      </header>
      <div className="forum-section-heading forum-section-heading--posts">
        <h2>Indlæg</h2>
        <nav aria-label="Sortér forumindlæg" className="forum-sort">
          <Link className={sort === "newest" ? "is-active" : undefined} href={basePath}>
            Nyeste
          </Link>
          <Link
            className={sort === "score" ? "is-active" : undefined}
            href={`${basePath}?sort=score`}
          >
            Højeste score
          </Link>
        </nav>
      </div>
      <ForumPostList posts={posts} />
    </div>
  );
}
