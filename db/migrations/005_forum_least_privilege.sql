revoke update on public.forum_posts from cykelbasen_app;
grant update (category_slug, title, body) on public.forum_posts to cykelbasen_app;

revoke update on public.forum_comments from cykelbasen_app;
grant update (body) on public.forum_comments to cykelbasen_app;

revoke update on public.post_votes from cykelbasen_app;
grant update (value) on public.post_votes to cykelbasen_app;

revoke update on public.comment_votes from cykelbasen_app;
grant update (value) on public.comment_votes to cykelbasen_app;

update public.forum_posts post
set score = (
  select coalesce(sum(vote.value), 0)::int
  from public.post_votes vote
  where vote.post_id = post.id
);

update public.forum_comments comment
set score = (
  select coalesce(sum(vote.value), 0)::int
  from public.comment_votes vote
  where vote.comment_id = comment.id
);
