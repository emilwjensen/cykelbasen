import Image from "next/image";
import Link from "next/link";
import { formatDate, formatPrice } from "@/features/listings/format";
import { getSellerListings } from "@/features/listings/draft-queries";
import { getProfile } from "@/features/profiles/queries";
import { requireUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

const statusLabels = {
  draft: "Kladde",
  pending_review: "Afventer kontrol",
  rejected: "Kræver ændringer",
  published: "Publiceret",
  reserved: "Reserveret",
  sold: "Solgt",
  archived: "Arkiveret",
} as const;

type SellerDashboardProps = {
  searchParams: Promise<{
    oprettet?: string;
    gemt?: string;
  }>;
};

export default async function SellerDashboard({
  searchParams,
}: SellerDashboardProps) {
  const [user, params] = await Promise.all([requireUser(), searchParams]);
  const [profile, listings] = await Promise.all([
    getProfile(user.id),
    getSellerListings(user.id),
  ]);

  return (
    <div className="account-page shell">
      <header className="dashboard-heading">
        <div>
          <p className="eyebrow">Sælgerområde</p>
          <h1>Mine annoncer</h1>
          <p>
            Hold styr på kladder, dokumentation og publicerede cykler.
          </p>
        </div>
        <Link className="button button--accent" href="/annoncer/ny">
          Opret annonce
        </Link>
      </header>

      {!profile && (
        <div className="profile-warning">
          <div>
            <strong>Færdiggør din profil først</strong>
            <p>Et visningsnavn og en by er nødvendige for at oprette annoncer.</p>
          </div>
          <Link className="button button--dark" href="/profil?ny=1">
            Gå til profil
          </Link>
        </div>
      )}

      {(params.oprettet || params.gemt) && (
        <p className="form-message form-message--success">
          {params.oprettet ? "Kladde oprettet." : "Ændringerne er gemt."}
        </p>
      )}

      {listings.length ? (
        <div className="seller-list">
          {listings.map((listing) => (
            <article className="seller-listing" key={listing.id}>
              <div className="seller-listing__image">
                {listing.cover_url ? (
                  <Image
                    alt=""
                    fill
                    sizes="160px"
                    src={listing.cover_url}
                  />
                ) : (
                  <span>Intet billede</span>
                )}
              </div>
              <div className="seller-listing__main">
                <div className="seller-listing__meta">
                  <span className={`status status--${listing.status}`}>
                    {statusLabels[listing.status]}
                  </span>
                  <span>Opdateret {formatDate(listing.updated_at)}</span>
                </div>
                <h2>{listing.title}</h2>
                <p>
                  {listing.brand} {listing.model} ·{" "}
                  {formatPrice(listing.price_dkk)}
                </p>
              </div>
              <div className="seller-listing__actions">
                {["draft", "rejected"].includes(listing.status) ? (
                  <Link
                    className="button button--quiet"
                    href={`/annoncer/${listing.id}/rediger`}
                  >
                    Redigér
                  </Link>
                ) : listing.status === "published" ? (
                  <Link
                    className="button button--quiet"
                    href={`/cykler/${listing.id}`}
                  >
                    Se annonce
                  </Link>
                ) : (
                  <span className="seller-listing__locked">
                    Redigering er låst
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p className="eyebrow">Ingen kladder endnu</p>
          <h2>Start med de oplysninger, du allerede har.</h2>
          <p>
            Billeder og ejerskabsdokumentation kommer i de næste trin og er ikke
            nødvendige for at gemme en kladde.
          </p>
          <Link className="button button--dark" href="/annoncer/ny">
            Opret første kladde
          </Link>
        </div>
      )}
    </div>
  );
}

