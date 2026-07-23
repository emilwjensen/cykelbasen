import Link from "next/link";
import { AccountNavigation } from "@/components/account-navigation";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
  updateNotificationPreferencesAction,
} from "@/features/notifications/actions";
import { getNotificationCenter } from "@/features/notifications/queries";
import { formatDate } from "@/features/listings/format";
import { requireUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ gemt?: string; laest?: string }>;
}) {
  const [user, query] = await Promise.all([requireUser(), searchParams]);
  const center = await getNotificationCenter(user.id);
  const unread = center.notifications.filter((item) => !item.read_at).length;

  return (
    <div className="account-page shell">
      <AccountNavigation />
      <header className="account-heading">
        <p className="eyebrow">Dit overblik</p>
        <h1>Notifikationer</h1>
        <p>
          Henvendelser og dokumentkontrol gemmes som hændelser. Forfaldent
          vedligehold beregnes direkte fra dine aktuelle cykeldata.
        </p>
      </header>
      {(query.gemt || query.laest) && (
        <p className="form-message form-message--success">
          {query.gemt ? "Indstillingerne er gemt." : "Alt er markeret som læst."}
        </p>
      )}

      {center.dueMaintenance.length > 0 && (
        <section className="account-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Kræver handling</p>
              <h2>Forfalden vedligehold</h2>
            </div>
          </div>
          <div className="notification-list">
            {center.dueMaintenance.map((item) => (
              <Link href={`/mine-cykler/${item.bike_id}#vedligehold`} key={item.id}>
                <strong>{item.title} · {item.bike_name}</strong>
                <span>
                  {item.due_on ? `Dato ${formatDate(item.due_on)}` : ""}
                  {item.due_on && item.due_odometer_km !== null ? " · " : ""}
                  {item.due_odometer_km !== null
                    ? `Ved ${item.due_odometer_km.toLocaleString("da-DK")} km`
                    : ""}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="account-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Hændelser</p>
            <h2>{unread} ulæste</h2>
          </div>
          {unread > 0 && (
            <form action={markAllNotificationsReadAction}>
              <button className="button button--quiet" type="submit">Markér alle læst</button>
            </form>
          )}
        </div>
        <div className="notification-list">
          {center.notifications.length ? center.notifications.map((item) => (
            <article className={item.read_at ? "" : "is-unread"} key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
                <small>{formatDate(item.created_at)}</small>
              </div>
              <div className="form-actions">
                {item.href && <Link className="text-link" href={item.href}>Åbn</Link>}
                {!item.read_at && (
                  <form action={markNotificationReadAction.bind(null, item.id)}>
                    <button className="button button--quiet" type="submit">Markér læst</button>
                  </form>
                )}
              </div>
            </article>
          )) : (
            <p>Ingen hændelser endnu.</p>
          )}
        </div>
      </section>

      <form action={updateNotificationPreferencesAction} className="account-card stacked-form">
        <h2>Indstillinger</h2>
        <label className="garage-log-check">
          <input defaultChecked={center.preferences.in_app_enabled} name="inAppEnabled" type="checkbox" />
          Vis notifikationer i platformen
        </label>
        <label className="garage-log-check">
          <input defaultChecked={center.preferences.contact_email_enabled} name="contactEmailEnabled" type="checkbox" />
          E-mail om køberhenvendelser, når maillevering tilsluttes
        </label>
        <label className="garage-log-check">
          <input defaultChecked={center.preferences.maintenance_email_enabled} name="maintenanceEmailEnabled" type="checkbox" />
          E-mail om vedligehold, når maillevering tilsluttes
        </label>
        <p className="form-help">
          In-app notifikationer virker nu. E-mailvalg er klargjort, men kræver
          en separat mailudbyder og et planlagt job før aktivering.
        </p>
        <button className="button button--accent" type="submit">Gem indstillinger</button>
      </form>
    </div>
  );
}
