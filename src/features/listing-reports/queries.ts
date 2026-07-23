import "server-only";

import type { ReportStatus } from "@/features/moderation/types";
import { getApplicationDatabase } from "@/lib/database";
import type { ListingModerationReport } from "./types";

export async function getListingModerationReports(
  userId: string,
  status: ReportStatus,
): Promise<ListingModerationReport[]> {
  const database = getApplicationDatabase();
  const results = await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${userId}, true)`,
    transaction`
      select
        report.id,
        report.listing_id,
        listing.title as listing_title,
        listing.status as listing_status,
        seller.display_name as seller_name,
        reporter.display_name as reporter_name,
        report.reason,
        report.details,
        report.status,
        report.created_at,
        report.moderated_at,
        report.moderation_note,
        moderator.display_name as moderator_name
      from public.listing_reports report
      join public.listings listing on listing.id = report.listing_id
      join public.profiles seller on seller.id = listing.seller_id
      join public.profiles reporter on reporter.id = report.reporter_id
      left join public.profiles moderator on moderator.id = report.moderated_by
      where report.status = ${status}::public.content_report_status
      order by
        case when report.status = 'open' then report.created_at end,
        report.moderated_at desc
    `,
  ]);

  return results[1] as unknown as ListingModerationReport[];
}
