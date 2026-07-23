import Link from "next/link";
import {
  updateContactRequestStatusAction,
} from "@/features/contact-requests/actions";
import { getSellerContactRequests } from "@/features/contact-requests/queries";
import {
  contactIntents,
  type ContactRequestStatus,
} from "@/features/contact-requests/types";
import { formatForumDate } from "@/features/forum/format";
import { requireUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

const statusLabels: Record<ContactRequestStatus, string> = {
  new: "Nye",
  read: "Læste",
  closed: "Afsluttede",
};

const intentLabels = Object.fromEntries(
  contactIntents.map((intent) => [intent.value, intent.label]),
);

function parseStatus(value?: string): ContactRequestStatus {
  return value === "read" || value === "closed" ? value : "new";
}

type ContactRequestsPageProps = {
  searchParams: Promise<{
    status?: string;
    gemt?: string;
    fejl?: string;
  }>;
};

export default async function ContactRequestsPage({
  searchParams,
}: ContactRequestsPageProps) {
  const [user, query] = await Promise.all([requireUser(), searchParams]);
  const status = parseStatus(query.status);
  const requests = await getSellerContactRequests(user.id, status);

  return (
    <div className="account-page shell">
      <header className="dashboard-heading">
        <div>
          <p className="eyebrow">Sælgerindbakke</p>
          <h1>Henvendelser</h1>
          <p>
            Se spørgsmål, fremvisningsønsker og bud. Køberens e-mail deles kun
            i den konkrete henvendelse.
          </p>
        </div>
        <Link className="button button--quiet" href="/mine-annoncer">
          Mine annoncer
        </Link>
      </header>

      <nav aria-label="Filtrér henvendelser" className="moderation-tabs">
        {(Object.keys(statusLabels) as ContactRequestStatus[]).map((value) => (
          <Link
            className={status === value ? "is-active" : undefined}
            href={
              value === "new"
                ? "/henvendelser"
                : `/henvendelser?status=${value}`
            }
            key={value}
          >
            {statusLabels[value]}
          </Link>
        ))}
      </nav>

      {query.gemt && (
        <p className="form-message form-message--success">
          Henvendelsen er opdateret.
        </p>
      )}
      {query.fejl && (
        <p className="form-message form-message--error">
          Henvendelsen kunne ikke opdateres. Prøv igen.
        </p>
      )}

      {requests.length ? (
        <div className="contact-request-list">
          {requests.map((request) => (
            <article className="contact-request-card" key={request.id}>
              <header>
                <div>
                  <span className={`status status--contact-${request.status}`}>
                    {statusLabels[request.status]}
                  </span>
                  <span>{intentLabels[request.intent]}</span>
                </div>
                <time>{formatForumDate(request.created_at)}</time>
              </header>
              <div className="contact-request-card__body">
                <p className="eyebrow">{request.listing_title}</p>
                <h2>{request.buyer_name}</h2>
                <p className="contact-request-card__message">{request.message}</p>
                <div className="contact-request-card__links">
                  <a
                    className="button button--accent"
                    href={`mailto:${request.buyer_email}`}
                  >
                    Svar på e-mail
                  </a>
                  {request.listing_status === "published" && (
                    <Link
                      className="button button--quiet"
                      href={`/cykler/${request.listing_id}`}
                    >
                      Se annonce
                    </Link>
                  )}
                </div>
              </div>
              {request.status !== "closed" && (
                <footer>
                  {request.status === "new" && (
                    <form
                      action={updateContactRequestStatusAction.bind(
                        null,
                        request.id,
                        "read",
                      )}
                    >
                      <button className="text-button" type="submit">
                        Markér som læst
                      </button>
                    </form>
                  )}
                  <form
                    action={updateContactRequestStatusAction.bind(
                      null,
                      request.id,
                      "closed",
                    )}
                  >
                    <button className="text-button" type="submit">
                      Afslut henvendelse
                    </button>
                  </form>
                </footer>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p className="eyebrow">Indbakken er tom</p>
          <h2>Ingen {statusLabels[status].toLowerCase()} henvendelser.</h2>
          <p>Nye køberhenvendelser dukker automatisk op her.</p>
        </div>
      )}
    </div>
  );
}
