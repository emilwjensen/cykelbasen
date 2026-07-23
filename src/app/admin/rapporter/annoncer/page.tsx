import Link from "next/link";
import { notFound } from "next/navigation";
import { formatForumDate } from "@/features/forum/format";
import { moderateListingReportAction } from "@/features/listing-reports/actions";
import { getListingModerationReports } from "@/features/listing-reports/queries";
import { listingReportReasons } from "@/features/listing-reports/types";
import { isModerator } from "@/features/moderation/queries";
import type { ReportStatus } from "@/features/moderation/types";
import { requireUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

const statusLabels: Record<ReportStatus, string> = {
  open: "Åbne",
  resolved: "Fjernet",
  dismissed: "Afvist",
};

const reasonLabels = Object.fromEntries(
  listingReportReasons.map((reason) => [reason.value, reason.label]),
);

function parseStatus(value?: string): ReportStatus {
  return value === "resolved" || value === "dismissed" ? value : "open";
}

type ListingReportsPageProps = {
  searchParams: Promise<{
    status?: string;
    gemt?: string;
    fejl?: string;
  }>;
};

export default async function ListingReportsPage({
  searchParams,
}: ListingReportsPageProps) {
  const [user, query] = await Promise.all([requireUser(), searchParams]);
  if (!(await isModerator(user.id))) notFound();

  const status = parseStatus(query.status);
  const reports = await getListingModerationReports(user.id, status);

  return (
    <div className="moderation-page shell">
      <header className="dashboard-heading moderation-heading">
        <div>
          <p className="eyebrow">Markedspladsmoderation</p>
          <h1>Rapporterede annoncer</h1>
          <p>
            Undersøg dokumentation og annonceoplysninger, før en annonce
            fjernes fra markedspladsen.
          </p>
        </div>
        <Link className="button button--quiet" href="/admin/rapporter">
          Se forumrapporter
        </Link>
      </header>

      <nav aria-label="Filtrér annoncerapporter" className="moderation-tabs">
        {(Object.keys(statusLabels) as ReportStatus[]).map((value) => (
          <Link
            className={status === value ? "is-active" : undefined}
            href={
              value === "open"
                ? "/admin/rapporter/annoncer"
                : `/admin/rapporter/annoncer?status=${value}`
            }
            key={value}
          >
            {statusLabels[value]}
          </Link>
        ))}
      </nav>

      {query.gemt && (
        <p className="form-message form-message--success">
          Moderatorbeslutningen er gemt.
        </p>
      )}
      {query.fejl && (
        <p className="form-message form-message--error">
          Rapporten kunne ikke behandles. Genindlæs køen og prøv igen.
        </p>
      )}

      {reports.length ? (
        <div className="moderation-list">
          {reports.map((report) => (
            <article className="moderation-card" key={report.id}>
              <header className="moderation-card__header">
                <div>
                  <span className={`status status--report-${report.status}`}>
                    {statusLabels[report.status]}
                  </span>
                  <span>Annonce · {report.listing_status}</span>
                </div>
                <time>{formatForumDate(report.created_at)}</time>
              </header>

              <div className="moderation-card__context">
                <p className="eyebrow">{reasonLabels[report.reason]}</p>
                <h2>{report.listing_title}</h2>
                <p className="moderation-card__author">
                  Sælger: {report.seller_name} · rapporteret af{" "}
                  {report.reporter_name}
                </p>
                {report.details && (
                  <div className="moderation-card__report-note">
                    <strong>Rapportørens kontekst</strong>
                    <p>{report.details}</p>
                  </div>
                )}
                {report.listing_status === "published" && (
                  <Link
                    className="text-link"
                    href={`/cykler/${report.listing_id}`}
                  >
                    Se annonce <span aria-hidden="true">→</span>
                  </Link>
                )}
              </div>

              {report.status === "open" ? (
                <form
                  action={moderateListingReportAction}
                  className="moderation-form"
                >
                  <input name="reportId" type="hidden" value={report.id} />
                  <input name="listingId" type="hidden" value={report.listing_id} />
                  <label>
                    <span>Moderatorens begrundelse</span>
                    <textarea
                      maxLength={1_000}
                      minLength={5}
                      name="note"
                      required
                      rows={4}
                    />
                  </label>
                  <div>
                    <button
                      className="button button--danger"
                      name="decision"
                      type="submit"
                      value="hide"
                    >
                      Fjern annonce
                    </button>
                    <button
                      className="button button--quiet"
                      name="decision"
                      type="submit"
                      value="dismiss"
                    >
                      Afvis rapport
                    </button>
                  </div>
                </form>
              ) : (
                <div className="moderation-decision">
                  <strong>
                    Behandlet af {report.moderator_name ?? "moderator"}
                    {report.moderated_at
                      ? ` · ${formatForumDate(report.moderated_at)}`
                      : ""}
                  </strong>
                  <p>{report.moderation_note}</p>
                  {report.listing_status === "archived" && (
                    <span>Annoncen er fjernet</span>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p className="eyebrow">Køen er tom</p>
          <h2>Ingen {statusLabels[status].toLowerCase()} annoncerapporter.</h2>
          <p>Nye rapporter dukker automatisk op her.</p>
        </div>
      )}
    </div>
  );
}
