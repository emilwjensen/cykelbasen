import "server-only";

import { getApplicationDatabase } from "@/lib/database";
import type {
  EditableForumPost,
  ForumCategory,
  ForumComment,
  ForumPostDetail,
  ForumPostSummary,
  ForumSort,
} from "./types";

function userContext(userId?: string | null) {
  return userId ?? "";
}

export async function getForumCategories(): Promise<ForumCategory[]> {
  const database = getApplicationDatabase();
  const rows = await database`
    select
      category.slug,
      category.name,
      category.description,
      count(post.id)::int as post_count,
      max(post.created_at) as last_activity
    from public.forum_categories category
    left join public.forum_posts post
      on post.category_slug = category.slug
      and post.hidden_at is null
    group by category.slug, category.name, category.description, category.position
    order by category.position
  `;

  return rows as unknown as ForumCategory[];
}

export async function getForumCategory(slug: string) {
  const database = getApplicationDatabase();
  const rows = await database`
    select slug, name, description
    from public.forum_categories
    where slug = ${slug}
    limit 1
  `;

  const categories = rows as unknown as Array<{
    slug: string;
    name: string;
    description: string;
  }>;
  return categories[0] ?? null;
}

export async function getForumPosts({
  categorySlug,
  sort,
}: {
  categorySlug?: string;
  sort: ForumSort;
}): Promise<ForumPostSummary[]> {
  const database = getApplicationDatabase();
  const category = categorySlug ?? null;
  const rows = await database`
    select
      post.id,
      post.title,
      post.body,
      post.score,
      post.created_at,
      post.updated_at,
      post.category_slug,
      category.name as category_name,
      post.author_id,
      profile.display_name as author_name,
      profile.city as author_city,
      count(comment.id)::int as comment_count
    from public.forum_posts post
    join public.forum_categories category on category.slug = post.category_slug
    join public.profiles profile on profile.id = post.author_id
    left join public.forum_comments comment
      on comment.post_id = post.id
      and comment.hidden_at is null
    where post.hidden_at is null
      and (${category}::text is null or post.category_slug = ${category})
    group by
      post.id,
      category.name,
      profile.display_name,
      profile.city
    order by
      case when ${sort} = 'score' then post.score end desc,
      case when ${sort} = 'newest' then post.created_at end desc,
      post.created_at desc
    limit 50
  `;

  return rows as unknown as ForumPostSummary[];
}

export async function getForumPost(
  postId: string,
  userId?: string | null,
): Promise<{ post: ForumPostDetail | null; comments: ForumComment[] }> {
  const database = getApplicationDatabase();
  const results = await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${userContext(userId)}, true)`,
    transaction`
      select
        post.id,
        post.title,
        post.body,
        post.score,
        post.created_at,
        post.updated_at,
        post.category_slug,
        category.name as category_name,
        post.author_id,
        profile.display_name as author_name,
        profile.city as author_city,
        count(comment.id)::int as comment_count,
        coalesce(vote.value, 0)::int as current_vote
      from public.forum_posts post
      join public.forum_categories category on category.slug = post.category_slug
      join public.profiles profile on profile.id = post.author_id
      left join public.forum_comments comment
        on comment.post_id = post.id
        and comment.hidden_at is null
      left join public.post_votes vote
        on vote.post_id = post.id
        and vote.user_id = ${userContext(userId)}
      where post.id = ${postId}::uuid
        and post.hidden_at is null
      group by
        post.id,
        category.name,
        profile.display_name,
        profile.city,
        vote.value
      limit 1
    `,
    transaction`
      select
        comment.id,
        comment.post_id,
        comment.parent_id,
        comment.body,
        comment.score,
        comment.created_at,
        comment.updated_at,
        comment.author_id,
        profile.display_name as author_name,
        coalesce(vote.value, 0)::int as current_vote
      from public.forum_comments comment
      join public.profiles profile on profile.id = comment.author_id
      left join public.comment_votes vote
        on vote.comment_id = comment.id
        and vote.user_id = ${userContext(userId)}
      where comment.post_id = ${postId}::uuid
        and comment.hidden_at is null
      order by
        coalesce(comment.parent_id, comment.id),
        comment.parent_id nulls first,
        comment.created_at
    `,
  ]);

  const posts = results[1] as unknown as ForumPostDetail[];
  return {
    post: posts[0] ?? null,
    comments: results[2] as unknown as ForumComment[],
  };
}

export async function getEditableForumPost(
  postId: string,
  userId: string,
): Promise<EditableForumPost | null> {
  const database = getApplicationDatabase();
  const results = await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${userId}, true)`,
    transaction`
      select id, category_slug, title, body
      from public.forum_posts
      where id = ${postId}::uuid
        and author_id = ${userId}
        and hidden_at is null
      limit 1
    `,
  ]);

  const rows = results[1] as unknown as EditableForumPost[];
  return rows[0] ?? null;
}
