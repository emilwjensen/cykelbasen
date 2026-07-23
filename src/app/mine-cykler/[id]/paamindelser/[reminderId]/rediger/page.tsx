import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AccountNavigation } from "@/components/account-navigation";
import {
  cancelBikeMaintenanceReminderAction,
  updateBikeMaintenanceReminderAction,
} from "@/features/garage/actions";
import { getGarageBike } from "@/features/garage/queries";
import { componentCategories } from "@/features/listings/types";
import { requireUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function EditReminderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; reminderId: string }>;
  searchParams: Promise<{ fejl?: string }>;
}) {
  const [user, { id, reminderId }, query] = await Promise.all([
    requireUser(),
    params,
    searchParams,
  ]);
  if (
    !z.string().uuid().safeParse(id).success ||
    !z.string().uuid().safeParse(reminderId).success
  ) {
    notFound();
  }
  const bike = await getGarageBike(user.id, id);
  const reminder = bike?.reminders.find((item) => item.id === reminderId);
  if (
    !bike ||
    !reminder ||
    reminder.completed_at ||
    bike.ownership_ended_on ||
    bike.retired_on
  ) {
    notFound();
  }

  return (
    <div className="account-page shell">
      <AccountNavigation />
      <Link className="back-link" href={`/mine-cykler/${bike.id}#vedligehold`}>
        ← Tilbage til vedligehold
      </Link>
      <header className="account-heading">
        <p className="eyebrow">Planlagt vedligehold</p>
        <h1>Redigér påmindelse</h1>
        <p>Alle ændringer gemmer den tidligere version og en begrundelse.</p>
      </header>
      {query.fejl && (
        <p className="form-message form-message--error" role="alert">
          Påmindelsen kunne ikke ændres. Kontrollér deadline og begrundelse.
        </p>
      )}
      <form
        action={updateBikeMaintenanceReminderAction.bind(
          null,
          bike.id,
          reminder.id,
        )}
        className="account-card stacked-form"
      >
        <label>
          Opgave
          <input defaultValue={reminder.title} maxLength={120} minLength={3} name="title" required />
        </label>
        <label>
          Komponent
          <select defaultValue={reminder.component_category ?? ""} name="componentCategory">
            <option value="">Hele cyklen</option>
            {componentCategories.map((component) => (
              <option key={component.value} value={component.value}>
                {component.label}
              </option>
            ))}
          </select>
        </label>
        <div className="form-grid form-grid--two">
          <label>
            Senest dato
            <input defaultValue={reminder.due_on ?? ""} name="dueOn" type="date" />
          </label>
          <label>
            Ved kilometerstand
            <input
              defaultValue={reminder.due_odometer_km ?? ""}
              min={bike.current_odometer_km}
              name="dueOdometerKm"
              type="number"
            />
          </label>
        </div>
        <label>
          Noter
          <textarea defaultValue={reminder.notes ?? ""} maxLength={2_000} name="notes" rows={4} />
        </label>
        <label>
          Begrund ændringen eller udsættelsen
          <textarea maxLength={500} minLength={3} name="changeReason" required rows={3} />
        </label>
        <button className="button button--accent" type="submit">Gem ændring</button>
      </form>
      <form
        action={cancelBikeMaintenanceReminderAction.bind(
          null,
          bike.id,
          reminder.id,
        )}
        className="account-card stacked-form"
      >
        <h2>Annullér påmindelse</h2>
        <label>
          Begrund annullering
          <input maxLength={500} minLength={3} name="changeReason" required />
        </label>
        <button className="button button--quiet" type="submit">Annullér</button>
      </form>
    </div>
  );
}
