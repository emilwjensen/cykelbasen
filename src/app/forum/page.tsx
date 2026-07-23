import Link from "next/link";
import { ForumPostList } from "@/features/forum/components/forum-post-list";
import {
  getForumCategories,
  getForumPosts,
} from "@/features/forum/queries";
import { parseForumSort } from "@/features/forum/schema";

export const dynamic = "force-dynamic";

type ForumPageProps = {
  searchParams: Promise<{ sort?: string | string[] }>;
};

export default async function ForumPage({ searchParams }: ForumPageProps) {
  const params = await searchParams;
  const sort = parseForumSort(params.sort);
  const [categories, posts] = await Promise.all([
    getForumCategories(),
    getForumPosts({ sort }),
  ]);

  return (
    <div className="forum-page shell">
      <header className="forum-hero">
        <div>
          <p className="eyebrow">Cykelbasen forum</p>
          <h1>Viden bliver bedre, når den bliver delt.</h1>
          <p>
            Spørg om cykelvalg, udstyr og vedligeholdelse – eller hjælp andre
            med erfaringer fra landevejen.
          </p>
        </div>
        <Link className="button button--accent" href="/forum/nyt">
          Opret indlæg
        </Link>
      </header>

      <section aria-labelledby="forum-categories" className="forum-categories">
        <div className="forum-section-heading">
          <h2 id="forum-categories">Kategorier</h2>
        </div>
        <div className="forum-category-grid">
          {categories.map((category) => (
            <Link
              className="forum-category-card"
              href={`/forum/${category.slug}`}
              key={category.slug}
            >
              <div>
                <h3>{category.name}</h3>
                <p>{category.description}</p>
              </div>
              <span>{category.post_count} indlæg</span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="forum-posts">
        <div className="forum-section-heading forum-section-heading--posts">
          <div>
            <p className="eyebrow">På tværs af forum</p>
            <h2 id="forum-posts">Seneste samtaler</h2>
          </div>
          <nav aria-label="Sortér forumindlæg" className="forum-sort">
            <Link className={sort === "newest" ? "is-active" : undefined} href="/forum">
              Nyeste
            </Link>
            <Link
              className={sort === "score" ? "is-active" : undefined}
              href="/forum?sort=score"
            >
              Højeste score
            </Link>
          </nav>
        </div>
        <ForumPostList posts={posts} />
      </section>
    </div>
  );
}
