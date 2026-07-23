import Link from "next/link";
import { AccountNavigation } from "@/components/account-navigation";
import { EmptyState } from "@/components/empty-state";
import { getFavoriteListings } from "@/features/favorites/queries";
import { ListingCard } from "@/features/listings/components/listing-card";
import { requireUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const user = await requireUser();
  const listings = await getFavoriteListings(user.id);

  return (
    <div className="browse shell">
      <AccountNavigation />
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
        <EmptyState
          action={
            <Link className="button button--dark" href="/cykler">
              Se cykler til salg
            </Link>
          }
          eyebrow="Ingen favoritter endnu"
          icon="♡"
          title="Saml de cykler, du overvejer."
        >
          <p>
            Åbn en annonce og vælg “Gem som favorit”. Så finder du den her,
            mens den stadig er til salg.
          </p>
        </EmptyState>
      )}
    </div>
  );
}
