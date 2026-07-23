import Link from "next/link";
import { notFound } from "next/navigation";
import { ModerationNavigation } from "@/components/moderation-navigation";
import { formatForumDate } from "@/features/forum/format";
import { isModerator } from "@/features/moderation/queries";
import { moderateOwnershipDocumentAction } from "@/features/ownership/actions";
import { getOwnershipReviewQueue } from "@/features/ownership/queries";
import type { OwnershipDocumentStatus } from "@/features/ownership/types";
import { requireUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

const statusLabels: Record<OwnershipDocumentStatus, string> = {
  pending: "Afventer",
  approved: "Godkendt",
  rejected: "Afvist",
};

function parseStatus(value?: string): OwnershipDocumentStatus {
  return value === "approved" || value === "rejected" ? value : "pending";
}

type OwnershipQueuePageProps = {
  searchParams: Promise<{
    status?: string;
    gemt?: string;
    fejl?: string;
  }>;
};

export default async function OwnershipQueuePage({
  searchParams,
}: OwnershipQueuePageProps) {
  const [user, query] = await Promise.all([requireUser(), searchParams]);
  if (!(await isModerator(user.id))) notFound();

  const status = parseStatus(query.status);
  const documents = await getOwnershipReviewQueue(user.id, status);

  return (
    <div className="moderation-page shell">
      <ModerationNavigation />
      <header className="dashboard-heading moderation-heading">
        <div>
          <p className="eyebrow">Ejerskabskontrol</p>
          <h1>Dokumentation</h1>
          <p>
            Kontrollér sammenhængen mellem sælger, cykel og bilag. En
            godkendelse publicerer annoncen atomisk.
          </p>
        </div>
      </header>

      <nav aria-label="Filtrér dokumentation" className="moderation-tabs">
        {(Object.keys(statusLabels) as OwnershipDocumentStatus[]).map((value) => (
          <Link
            className={status === value ? "is-active" : undefined}
            href={
              value === "pending"
                ? "/admin/dokumentation"
                : `/admin/dokumentation?status=${value}`
            }
            key={value}
          >
            {statusLabels[value]}
          </Link>
        ))}
      </nav>

      {query.gemt && (
        <p className="form-message form-message--success">
          Dokumentkontrollen er gemt.
        </p>
      )}
      {query.fejl && (
        <p className="form-message form-message--error">
          Dokumentet kunne ikke behandles. Genindlæs køen og prøv igen.
        </p>
      )}

      {documents.length ? (
        <div className="moderation-list">
          {documents.map((document) => (
            <article className="moderation-card" key={document.id}>
              <header className="moderation-card__header">
                <div>
                  <span className={`status status--document-${document.status}`}>
                    {statusLabels[document.status]}
                  </span>
                  <span>
                    Stelnummer{" "}
                    {document.frame_number_registered
                      ? "registreret som hash"
                      : "ikke registreret"}
                  </span>
                </div>
                <time>{formatForumDate(document.created_at)}</time>
              </header>

              <div className="moderation-card__context">
                <p className="eyebrow">Sælger: {document.seller_name}</p>
                <h2>{document.listing_title}</h2>
                <div className="ownership-document-reference">
                  <strong>Privat dokumentreference</strong>
                  <code>{document.object_key}</code>
                  <p>
                    Signed preview aktiveres først, når privat object storage
                    er valgt. Referencen er kun synlig i moderatorområdet.
                  </p>
                </div>
              </div>

              {document.status === "pending" ? (
                <form
                  action={moderateOwnershipDocumentAction}
                  className="moderation-form"
                >
                  <input name="documentId" type="hidden" value={document.id} />
                  <input name="listingId" type="hidden" value={document.listing_id} />
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
                      className="button button--accent"
                      name="decision"
                      type="submit"
                      value="approve"
                    >
                      Godkend og publicér
                    </button>
                    <button
                      className="button button--danger"
                      name="decision"
                      type="submit"
                      value="reject"
                    >
                      Afvis dokumentation
                    </button>
                  </div>
                </form>
              ) : (
                <div className="moderation-decision">
                  <strong>
                    Behandlet af {document.moderator_name ?? "moderator"}
                    {document.reviewed_at
                      ? ` · ${formatForumDate(document.reviewed_at)}`
                      : ""}
                  </strong>
                  <p>{document.review_note}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p className="eyebrow">Køen er tom</p>
          <h2>Ingen dokumenter med status {statusLabels[status].toLowerCase()}.</h2>
          <p>Nye indsendelser dukker automatisk op her.</p>
        </div>
      )}
    </div>
  );
}
