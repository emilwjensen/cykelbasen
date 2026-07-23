import Link from "next/link";
import {
  cancelListingReservationAction,
  reserveListingForContactAction,
  updateContactRequestStatusAction,
} from "@/features/contact-requests/actions";
import {
  getBuyerContactRequests,
  getSellerContactRequests,
} from "@/features/contact-requests/queries";
import {
  contactIntents,
  type ContactRequestStatus,
  type ListingReservationStatus,
} from "@/features/contact-requests/types";
import { formatForumDate } from "@/features/forum/format";
import { setSellerListingStatusAction } from "@/features/listings/status-actions";
import { requireUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

const statusLabels: Record<ContactRequestStatus, string> = {
  new: "Nye",
  read: "Læste",
  closed: "Afsluttede",
};

const reservationLabels: Record<ListingReservationStatus, string> = {
  active: "Aktiv reservation",
  cancelled: "Frigivet",
  completed: "Handel afsluttet",
};

const intentLabels = Object.fromEntries(
  contactIntents.map((intent) => [intent.value, intent.label]),
);

function parseStatus(value?: string): ContactRequestStatus {
  return value === "read" || value === "closed" ? value : "new";
}

type ContactRequestsPageProps = {
  searchParams: Promise<{
    rolle?: string;
    status?: string;
    gemt?: string;
    reservation?: string;
    fejl?: string;
  }>;
};

export default async function ContactRequestsPage({
  searchParams,
}: ContactRequestsPageProps) {
  const [user, query] = await Promise.all([requireUser(), searchParams]);
  const buyerView = query.rolle === "koeber";
  const status = parseStatus(query.status);
  const sellerRequests = buyerView
    ? []
    : await getSellerContactRequests(user.id, status);
  const buyerRequests = buyerView
    ? await getBuyerContactRequests(user.id)
    : [];

  return (
    <div className="account-page shell">
      <header className="dashboard-heading">
        <div>
          <p className="eyebrow">Handelsdialog</p>
          <h1>Henvendelser og reservationer</h1>
          <p>
            Følg interessen fra første besked til en tydelig reservation eller
            afsluttet handel.
          </p>
        </div>
        <Link className="button button--quiet" href="/mine-annoncer">
          Mine annoncer
        </Link>
      </header>

      <nav aria-label="Vælg rolle" className="inbox-role-tabs">
        <Link className={!buyerView ? "is-active" : undefined} href="/henvendelser">
          Som sælger
        </Link>
        <Link
          className={buyerView ? "is-active" : undefined}
          href="/henvendelser?rolle=koeber"
        >
          Som køber
        </Link>
      </nav>

      {!buyerView && (
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
      )}

      {query.gemt && (
        <p className="form-message form-message--success">
          Henvendelsen er opdateret.
        </p>
      )}
      {query.reservation && (
        <p className="form-message form-message--success">
          {query.reservation === "oprettet"
            ? "Cyklen er reserveret til den valgte køber."
            : "Reservationen er frigivet, og annoncen er tilgængelig igen."}
        </p>
      )}
      {query.fejl && (
        <p className="form-message form-message--error">
          Handlingen kunne ikke gennemføres. Annoncen eller reservationen kan
          være ændret i mellemtiden.
        </p>
      )}

      {!buyerView && sellerRequests.length > 0 && (
        <div className="contact-request-list">
          {sellerRequests.map((request) => {
            const ownsActiveReservation =
              request.reservation_status === "active";
            const reservedForAnother =
              Boolean(request.active_listing_reservation_id) &&
              !ownsActiveReservation;

            return (
              <article className="contact-request-card" key={request.id}>
                <header>
                  <div>
                    <span className={`status status--contact-${request.status}`}>
                      {statusLabels[request.status]}
                    </span>
                    <span>{intentLabels[request.intent]}</span>
                    {request.reservation_status && (
                      <span
                        className={`status status--reservation-${request.reservation_status}`}
                      >
                        {reservationLabels[request.reservation_status]}
                      </span>
                    )}
                  </div>
                  <time>{formatForumDate(request.created_at)}</time>
                </header>
                <div className="contact-request-card__body">
                  <p className="eyebrow">{request.listing_title}</p>
                  <h2>{request.buyer_name}</h2>
                  <p className="contact-request-card__message">
                    {request.message}
                  </p>

                  {ownsActiveReservation && (
                    <div className="reservation-panel">
                      <strong>Reserveret til {request.buyer_name}</strong>
                      <p>
                        Cyklen er fortsat synlig på markedet, men nye
                        henvendelser er sat på pause.
                      </p>
                      <div>
                        <form
                          action={cancelListingReservationAction.bind(
                            null,
                            request.reservation_id!,
                            request.listing_id,
                            "seller",
                          )}
                        >
                          <button className="button button--quiet" type="submit">
                            Frigiv reservation
                          </button>
                        </form>
                        <form
                          action={setSellerListingStatusAction.bind(
                            null,
                            request.listing_id,
                            "sold",
                          )}
                        >
                          <button className="button button--accent" type="submit">
                            Markér som solgt
                          </button>
                        </form>
                      </div>
                    </div>
                  )}

                  {reservedForAnother && (
                    <p className="reservation-inline-note">
                      Cyklen er allerede reserveret til en anden køber.
                    </p>
                  )}

                  <div className="contact-request-card__links">
                    <a
                      className="button button--accent"
                      href={`mailto:${request.buyer_email}`}
                    >
                      Svar på e-mail
                    </a>
                    {["published", "reserved"].includes(
                      request.listing_status,
                    ) && (
                      <Link
                        className="button button--quiet"
                        href={`/cykler/${request.listing_id}`}
                      >
                        Se annonce
                      </Link>
                    )}
                    {request.status !== "closed" &&
                      request.listing_status === "published" &&
                      !request.active_listing_reservation_id && (
                        <form
                          action={reserveListingForContactAction.bind(
                            null,
                            request.id,
                            request.listing_id,
                          )}
                        >
                          <button className="button button--dark" type="submit">
                            Reservér til denne køber
                          </button>
                        </form>
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
                    {!ownsActiveReservation && (
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
                    )}
                  </footer>
                )}
              </article>
            );
          })}
        </div>
      )}

      {buyerView && buyerRequests.length > 0 && (
        <div className="contact-request-list">
          {buyerRequests.map((request) => (
            <article className="contact-request-card" key={request.id}>
              <header>
                <div>
                  <span className={`status status--contact-${request.status}`}>
                    {statusLabels[request.status]}
                  </span>
                  <span>{intentLabels[request.intent]}</span>
                  {request.reservation_status && (
                    <span
                      className={`status status--reservation-${request.reservation_status}`}
                    >
                      {reservationLabels[request.reservation_status]}
                    </span>
                  )}
                </div>
                <time>{formatForumDate(request.created_at)}</time>
              </header>
              <div className="contact-request-card__body">
                <p className="eyebrow">Sælger: {request.seller_name}</p>
                <h2>{request.listing_title}</h2>
                <p className="contact-request-card__message">
                  {request.message}
                </p>

                {request.reservation_status === "active" && (
                  <div className="reservation-panel">
                    <strong>Cyklen er reserveret til dig</strong>
                    <p>
                      Aftal betaling og overdragelse direkte med sælgeren.
                      Cykelbasen håndterer ikke betalingen.
                    </p>
                    <form
                      action={cancelListingReservationAction.bind(
                        null,
                        request.reservation_id!,
                        request.listing_id,
                        "buyer",
                      )}
                    >
                      <button className="button button--quiet" type="submit">
                        Jeg springer fra
                      </button>
                    </form>
                  </div>
                )}

                <div className="contact-request-card__links">
                  {["published", "reserved"].includes(request.listing_status) && (
                    <Link
                      className="button button--quiet"
                      href={`/cykler/${request.listing_id}`}
                    >
                      Se annonce
                    </Link>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {((buyerView && buyerRequests.length === 0) ||
        (!buyerView && sellerRequests.length === 0)) && (
        <div className="empty-state">
          <p className="eyebrow">Ingen henvendelser</p>
          <h2>
            {buyerView
              ? "Du har ikke kontaktet en sælger endnu."
              : `Ingen ${statusLabels[status].toLowerCase()} henvendelser.`}
          </h2>
          <p>
            {buyerView
              ? "Dine beskeder og eventuelle reservationer samles her."
              : "Nye køberhenvendelser dukker automatisk op her."}
          </p>
          {buyerView && (
            <Link className="button button--dark" href="/cykler">
              Find en cykel
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
