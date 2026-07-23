import "server-only";

import { getApplicationDatabase } from "@/lib/database";
import type { ModerationReport, ReportStatus } from "./types";

export async function isModerator(userId: string) {
  const database = getApplicationDatabase();
  const results = await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${userId}, true)`,
    transaction`select public.is_moderator() as allowed`,
  ]);

  return Boolean(results[1][0]?.allowed);
}

export async function getModerationReports(
  userId: string,
  status: ReportStatus,
): Promise<ModerationReport[]> {
  const database = getApplicationDatabase();
  const results = await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${userId}, true)`,
    transaction`
      select
        report.id,
        reporter.display_name as reporter_name,
        report.reason,
        report.details,
        report.status,
        report.created_at,
        report.moderated_at,
        report.moderation_note,
        moderator.display_name as moderator_name,
        case when report.post_id is not null then 'post' else 'comment' end as target_type,
        coalesce(report.post_id, report.comment_id) as target_id,
        coalesce(report.post_id, comment.post_id) as post_id,
        post.title as post_title,
        case when report.post_id is not null then post.body else comment.body end as target_body,
        target_author.display_name as target_author_name,
        case
          when report.post_id is not null then post.hidden_at is not null
          else comment.hidden_at is not null
        end as target_hidden
      from public.content_reports report
      join public.profiles reporter on reporter.id = report.reporter_id
      left join public.forum_comments comment on comment.id = report.comment_id
      join public.forum_posts post
        on post.id = coalesce(report.post_id, comment.post_id)
      join public.profiles target_author
        on target_author.id = case
          when report.post_id is not null then post.author_id
          else comment.author_id
        end
      left join public.profiles moderator on moderator.id = report.moderated_by
      where report.status = ${status}::public.content_report_status
      order by
        case when report.status = 'open' then report.created_at end,
        report.moderated_at desc
    `,
  ]);

  return results[1] as unknown as ModerationReport[];
}
