import Link from "next/link";
import { getFavoriteListings } from "@/features/favorites/queries";
import { ListingCard } from "@/features/listings/components/listing-card";
import { requireUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const user = await requireUser();
  const listings = await getFavoriteListings(user.id);

  return (
    <div className="browse shell">
      <header className="dashboard-heading">
        <div>
          <p className="eyebrow">Køberoverblik</p>
          <h1>Favoritter</h1>
          <p>
            Gem interessante cykler, sammenlign dem i ro og mag, og fjern dem
            igen med ét klik.
          </p>
        </div>
        <Link className="button button--accent" href="/cykler">
          Find flere cykler
        </Link>
      </header>

      {listings.length ? (
        <div className="listing-grid">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              returnUrl="/favoritter"
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p className="eyebrow">Ingen favoritter endnu</p>
          <h2>Saml de cykler, du overvejer.</h2>
          <p>
            Åbn en annonce og vælg “Gem som favorit”. Så finder du den her,
            mens den stadig er til salg.
          </p>
          <Link className="button button--dark" href="/cykler">
            Se cykler til salg
          </Link>
        </div>
      )}
    </div>
  );
}
