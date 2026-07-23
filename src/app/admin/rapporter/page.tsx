import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/server";
import { formatForumDate } from "@/features/forum/format";
import { reportReasons } from "@/features/forum/types";
import { moderateForumReportAction } from "@/features/moderation/actions";
import {
  getModerationReports,
  isModerator,
} from "@/features/moderation/queries";
import type { ReportStatus } from "@/features/moderation/types";

export const dynamic = "force-dynamic";

const statusLabels: Record<ReportStatus, string> = {
  open: "Åbne",
  resolved: "Skjult",
  dismissed: "Afvist",
};

const reasonLabels = Object.fromEntries(
  reportReasons.map((reason) => [reason.value, reason.label]),
);

function parseStatus(value?: string): ReportStatus {
  return value === "resolved" || value === "dismissed" ? value : "open";
}

type ReportsPageProps = {
  searchParams: Promise<{
    status?: string;
    gemt?: string;
    fejl?: string;
  }>;
};

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const [user, params] = await Promise.all([requireUser(), searchParams]);
  if (!(await isModerator(user.id))) notFound();

  const status = parseStatus(params.status);
  const reports = await getModerationReports(user.id, status);

  return (
    <div className="moderation-page shell">
      <header className="dashboard-heading moderation-heading">
        <div>
          <p className="eyebrow">Moderation</p>
          <h1>Rapporteret forumindhold</h1>
          <p>
            Vurder konteksten, skriv en begrundelse og skjul kun indhold, der
            bryder fællesskabets rammer.
          </p>
        </div>
        <Link className="button button--quiet" href="/forum">
          Gå til forum
        </Link>
      </header>

      <nav aria-label="Filtrér rapporter" className="moderation-tabs">
        {(Object.keys(statusLabels) as ReportStatus[]).map((value) => (
          <Link
            className={status === value ? "is-active" : undefined}
            href={
              value === "open"
                ? "/admin/rapporter"
                : `/admin/rapporter?status=${value}`
            }
            key={value}
          >
            {statusLabels[value]}
          </Link>
        ))}
      </nav>

      {params.gemt && (
        <p className="form-message form-message--success">
          Moderatorbeslutningen er gemt.
        </p>
      )}
      {params.fejl && (
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
                  <span>{report.target_type === "post" ? "Indlæg" : "Kommentar"}</span>
                </div>
                <time>{formatForumDate(report.created_at)}</time>
              </header>

              <div className="moderation-card__context">
                <p className="eyebrow">{reasonLabels[report.reason]}</p>
                <h2>{report.post_title}</h2>
                <p className="moderation-card__author">
                  Skrevet af {report.target_author_name} · rapporteret af{" "}
                  {report.reporter_name}
                </p>
                <blockquote>{report.target_body}</blockquote>
                {report.details && (
                  <div className="moderation-card__report-note">
                    <strong>Rapportørens kontekst</strong>
                    <p>{report.details}</p>
                  </div>
                )}
                <Link
                  className="text-link"
                  href={`/forum/indlaeg/${report.post_id}`}
                >
                  Se samtalen <span aria-hidden="true">→</span>
                </Link>
              </div>

              {report.status === "open" ? (
                <form action={moderateForumReportAction} className="moderation-form">
                  <input name="reportId" type="hidden" value={report.id} />
                  <input name="postId" type="hidden" value={report.post_id} />
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
                      Skjul indhold
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
                  {report.target_hidden && <span>Indholdet er skjult</span>}
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p className="eyebrow">Køen er tom</p>
          <h2>Ingen {statusLabels[status].toLowerCase()} rapporter.</h2>
          <p>Nye rapporter dukker automatisk op her.</p>
        </div>
      )}
    </div>
  );
}
