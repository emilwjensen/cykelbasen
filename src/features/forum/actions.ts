"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getProfile } from "@/features/profiles/queries";
import { requireUser } from "@/lib/auth/server";
import { getApplicationDatabase } from "@/lib/database";
import { forumCommentSchema, parseForumPostForm } from "./schema";
import type { ForumFormState } from "./types";

function fieldErrors(error: z.ZodError) {
  return z.flattenError(error).fieldErrors as Record<string, string[]>;
}

async function requireForumProfile(userId: string) {
  const profile = await getProfile(userId);
  if (!profile) redirect("/profil?ny=1");
}

export async function createForumPostAction(
  _state: ForumFormState,
  formData: FormData,
): Promise<ForumFormState> {
  const user = await requireUser();
  await requireForumProfile(user.id);
  const parsed = parseForumPostForm(formData);

  if (!parsed.success) {
    return {
      message: "Kontrollér de markerede felter.",
      errors: fieldErrors(parsed.error),
    };
  }

  const database = getApplicationDatabase();
  try {
    const results = await database.transaction((transaction) => [
      transaction`select set_config('app.user_id', ${user.id}, true)`,
      transaction`
        insert into public.forum_posts (
          category_slug,
          author_id,
          title,
          body
        )
        values (
          ${parsed.data.categorySlug},
          ${user.id},
          ${parsed.data.title},
          ${parsed.data.body}
        )
        returning id
      `,
    ]);
    const rows = results[1] as unknown as Array<{ id: string }>;
    const postId = rows[0]?.id;

    if (!postId) return { message: "Indlægget kunne ikke oprettes." };

    revalidatePath("/forum");
    redirect(`/forum/indlaeg/${postId}`);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    return { message: "Indlægget kunne ikke gemmes. Prøv igen." };
  }
}

export async function updateForumPostAction(
  postId: string,
  _state: ForumFormState,
  formData: FormData,
): Promise<ForumFormState> {
  const user = await requireUser();
  const validId = z.string().uuid().safeParse(postId);
  const parsed = parseForumPostForm(formData);

  if (!validId.success) return { message: "Indlægget kunne ikke findes." };
  if (!parsed.success) {
    return {
      message: "Kontrollér de markerede felter.",
      errors: fieldErrors(parsed.error),
    };
  }

  const database = getApplicationDatabase();
  try {
    const results = await database.transaction((transaction) => [
      transaction`select set_config('app.user_id', ${user.id}, true)`,
      transaction`
        update public.forum_posts
        set
          category_slug = ${parsed.data.categorySlug},
          title = ${parsed.data.title},
          body = ${parsed.data.body}
        where id = ${validId.data}::uuid
          and author_id = ${user.id}
          and hidden_at is null
        returning id
      `,
    ]);
    const rows = results[1] as unknown as Array<{ id: string }>;
    if (!rows[0]) return { message: "Indlægget kan ikke redigeres." };

    revalidatePath("/forum");
    revalidatePath(`/forum/indlaeg/${postId}`);
    redirect(`/forum/indlaeg/${postId}`);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    return { message: "Ændringerne kunne ikke gemmes. Prøv igen." };
  }
}

export async function createForumCommentAction(
  postId: string,
  formData: FormData,
) {
  const user = await requireUser();
  await requireForumProfile(user.id);
  const validPostId = z.string().uuid().safeParse(postId);
  const parsed = forumCommentSchema.safeParse({
    body: formData.get("body"),
    parentId: formData.get("parentId") ?? "",
  });

  if (!validPostId.success || !parsed.success) {
    redirect(`/forum/indlaeg/${postId}?fejl=kommentar#kommentarer`);
  }

  const database = getApplicationDatabase();
  try {
    await database.transaction((transaction) => [
      transaction`select set_config('app.user_id', ${user.id}, true)`,
      transaction`
        insert into public.forum_comments (
          post_id,
          author_id,
          parent_id,
          body
        )
        values (
          ${validPostId.data}::uuid,
          ${user.id},
          ${parsed.data.parentId}::uuid,
          ${parsed.data.body}
        )
      `,
    ]);
  } catch {
    redirect(`/forum/indlaeg/${postId}?fejl=kommentar#kommentarer`);
  }

  revalidatePath(`/forum/indlaeg/${postId}`);
  revalidatePath("/forum");
  redirect(`/forum/indlaeg/${postId}?kommenteret=1#kommentarer`);
}

export async function voteForumPostAction(
  postId: string,
  value: number,
) {
  const user = await requireUser();
  await requireForumProfile(user.id);
  const validId = z.string().uuid().safeParse(postId);
  const validValue = z.union([z.literal(-1), z.literal(1)]).safeParse(value);
  if (!validId.success || !validValue.success) return;

  const database = getApplicationDatabase();
  await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${user.id}, true)`,
    transaction`
      with removed as (
        delete from public.post_votes
        where post_id = ${validId.data}::uuid
          and user_id = ${user.id}
          and value = ${validValue.data}
        returning 1
      )
      insert into public.post_votes (post_id, user_id, value)
      select ${validId.data}::uuid, ${user.id}, ${validValue.data}
      where not exists (select 1 from removed)
      on conflict (post_id, user_id) do update
      set value = excluded.value
    `,
  ]);

  revalidatePath(`/forum/indlaeg/${postId}`);
  revalidatePath("/forum");
}

export async function voteForumCommentAction(
  postId: string,
  commentId: string,
  value: number,
) {
  const user = await requireUser();
  await requireForumProfile(user.id);
  const validPostId = z.string().uuid().safeParse(postId);
  const validCommentId = z.string().uuid().safeParse(commentId);
  const validValue = z.union([z.literal(-1), z.literal(1)]).safeParse(value);
  if (!validPostId.success || !validCommentId.success || !validValue.success) {
    return;
  }

  const database = getApplicationDatabase();
  await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${user.id}, true)`,
    transaction`
      with removed as (
        delete from public.comment_votes
        where comment_id = ${validCommentId.data}::uuid
          and user_id = ${user.id}
          and value = ${validValue.data}
        returning 1
      )
      insert into public.comment_votes (comment_id, user_id, value)
      select ${validCommentId.data}::uuid, ${user.id}, ${validValue.data}
      where not exists (select 1 from removed)
      on conflict (comment_id, user_id) do update
      set value = excluded.value
    `,
  ]);

  revalidatePath(`/forum/indlaeg/${postId}`);
}
