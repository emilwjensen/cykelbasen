import { requireUser } from "@/lib/auth/server";
import { getApplicationDatabase } from "@/lib/database";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser();
  const database = getApplicationDatabase();
  const results = await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${user.id}, true)`,
    transaction`
      select jsonb_build_object(
        'profile', (
          select to_jsonb(profile) - 'avatar_url'
          from public.profiles profile
          where profile.id = ${user.id}
        ),
        'listings', coalesce((
          select jsonb_agg(to_jsonb(listing) - 'search_vector')
          from public.listings listing
          where listing.seller_id = ${user.id}
        ), '[]'::jsonb),
        'registeredBikes', coalesce((
          select jsonb_agg(
            to_jsonb(bike)
            - 'serial_number_hash'
            - 'owner_id'
          )
          from public.garage_bikes bike
          where bike.owner_id = ${user.id}
        ), '[]'::jsonb),
        'bikeLogs', coalesce((
          select jsonb_agg(to_jsonb(log))
          from public.bike_log_entries log
          join public.garage_bikes bike on bike.id = log.bike_id
          where bike.owner_id = ${user.id}
        ), '[]'::jsonb),
        'maintenanceReminders', coalesce((
          select jsonb_agg(to_jsonb(reminder) - 'owner_id')
          from public.bike_maintenance_reminders reminder
          where reminder.owner_id = ${user.id}
        ), '[]'::jsonb),
        'bikeDocuments', coalesce((
          select jsonb_agg(
            to_jsonb(document)
            - 'object_key'
            - 'owner_id'
          )
          from public.bike_documents document
          where document.owner_id = ${user.id}
        ), '[]'::jsonb),
        'ownershipPeriods', coalesce((
          select jsonb_agg(to_jsonb(period) - 'owner_id')
          from public.bike_ownership_periods period
          where period.owner_id = ${user.id}
        ), '[]'::jsonb),
        'forumPosts', coalesce((
          select jsonb_agg(to_jsonb(post) - 'author_id')
          from public.forum_posts post
          where post.author_id = ${user.id}
        ), '[]'::jsonb),
        'forumComments', coalesce((
          select jsonb_agg(to_jsonb(comment) - 'author_id')
          from public.forum_comments comment
          where comment.author_id = ${user.id}
        ), '[]'::jsonb),
        'contactRequests', coalesce((
          select jsonb_agg(to_jsonb(request))
          from public.contact_requests request
          where request.buyer_id = ${user.id}
             or request.seller_id = ${user.id}
        ), '[]'::jsonb)
      ) as export_data
    `,
  ]);
  const row = (
    results[1] as unknown as Array<{ export_data: Record<string, unknown> }>
  )[0];
  const payload = {
    format: "cykelbasen-account-export-v1",
    generatedAt: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email,
    },
    ...row?.export_data,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="cykelbasen-eksport-${new Date()
        .toISOString()
        .slice(0, 10)}.json"`,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
