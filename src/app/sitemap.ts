import type { MetadataRoute } from "next";
import { getDatabase } from "@/lib/database";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const staticEntries: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/cykler`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${baseUrl}/forum`, changeFrequency: "daily", priority: 0.7 },
    { url: `${baseUrl}/privatliv`, changeFrequency: "monthly", priority: 0.2 },
    { url: `${baseUrl}/vilkaar`, changeFrequency: "monthly", priority: 0.2 },
  ];

  try {
    const [listings, posts] = await Promise.all([
      getDatabase().query(
        `
          select id, updated_at
          from public.listings
          where status in ('published', 'reserved')
          order by updated_at desc
          limit 5000
        `,
      ),
      getDatabase().query(
        `
          select id, updated_at
          from public.forum_posts
          where hidden_at is null
          order by updated_at desc
          limit 5000
        `,
      ),
    ]);

    return [
      ...staticEntries,
      ...(listings as unknown as Array<{ id: string; updated_at: string }>).map(
        (listing) => ({
          url: `${baseUrl}/cykler/${listing.id}`,
          lastModified: new Date(listing.updated_at),
          changeFrequency: "weekly" as const,
          priority: 0.8,
        }),
      ),
      ...(posts as unknown as Array<{ id: string; updated_at: string }>).map(
        (post) => ({
          url: `${baseUrl}/forum/indlaeg/${post.id}`,
          lastModified: new Date(post.updated_at),
          changeFrequency: "weekly" as const,
          priority: 0.5,
        }),
      ),
    ];
  } catch {
    return staticEntries;
  }
}

