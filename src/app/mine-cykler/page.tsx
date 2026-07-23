import Link from "next/link";
import { AccountNavigation } from "@/components/account-navigation";
import { categoryLabel, formatDate } from "@/features/listings/format";
import { getGarageBikes } from "@/features/garage/queries";
import { requireUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function MyBikesPage() {
  const user = await requireUser();
  const bikes = await getGarageBikes(user.id);

  return (
    <div className="garage-page shell">
      <AccountNavigation />
      <header className="dashboard-heading">
        <div>
          <p className="eyebrow">Din cykeldata</p>
          <h1>Mine cykler</h1>
          <p>
            Saml kilometer, service, komponenter og ejerhistorik ét sted. Kun du
            kan se dataene, indtil du vælger at bruge dem i en annonce.
          </p>
        </div>
        <div className="dashboard-heading__actions">
          <Link className="button button--quiet" href="/mine-cykler/overtag">
            Overtag med kode
          </Link>
          <Link className="button button--accent" href="/mine-cykler/ny">
            Registrér cykel
          </Link>
        </div>
      </header>

      {bikes.length ? (
        <div className="garage-grid">
          {bikes.map((bike) => (
            <Link
              className="garage-card"
              href={`/mine-cykler/${bike.id}`}
              key={bike.id}
            >
              <div className="garage-card__top">
                <span>
                  {bike.ownership_ended_on
                    ? "Tidligere cykel"
                    : categoryLabel(bike.category)}
                </span>
                <strong>{bike.current_odometer_km.toLocaleString("da-DK")} km</strong>
              </div>
              <h2>{bike.nickname}</h2>
              <p>
                {bike.brand} {bike.model}
                {bike.model_year ? ` · ${bike.model_year}` : ""}
                {bike.frame_size_label ? ` · str. ${bike.frame_size_label}` : ""}
              </p>
              {!bike.ownership_ended_on && bike.due_reminder_count > 0 && (
                <div className="garage-card__maintenance is-due">
                  {bike.due_reminder_count}{" "}
                  {bike.due_reminder_count === 1
                    ? "opgave er forfalden"
                    : "opgaver er forfaldne"}
                </div>
              )}
              {!bike.ownership_ended_on &&
                bike.due_reminder_count === 0 &&
                bike.open_reminder_count > 0 && (
                  <div className="garage-card__maintenance">
                    {bike.open_reminder_count} planlagte{" "}
                    {bike.open_reminder_count === 1 ? "opgave" : "opgaver"}
                  </div>
                )}
              <footer>
                <span>{bike.log_count} logposter</span>
                <span>
                  {bike.last_log_on
                    ? `Senest ${formatDate(bike.last_log_on)}`
                    : "Ingen historik endnu"}
                </span>
              </footer>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p className="eyebrow">Ingen cykler endnu</p>
          <h2>Start cyklens digitale historik.</h2>
          <p>
            Registrér din nuværende cykel og tilføj service, ture og
            komponentudskiftninger løbende.
          </p>
          <Link className="button button--dark" href="/mine-cykler/ny">
            Registrér første cykel
          </Link>
        </div>
      )}
    </div>
  );
}
