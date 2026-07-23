import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AccountNavigation } from "@/components/account-navigation";
import {
  correctBikeLogAction,
  voidBikeLogAction,
} from "@/features/garage/actions";
import { getGarageBike } from "@/features/garage/queries";
import { bikeLogTypes } from "@/features/garage/types";
import { componentCategories } from "@/features/listings/types";
import { requireUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function EditBikeLogPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; logId: string }>;
  searchParams: Promise<{ fejl?: string }>;
}) {
  const [user, { id, logId }, query] = await Promise.all([
    requireUser(),
    params,
    searchParams,
  ]);
  if (
    !z.string().uuid().safeParse(id).success ||
    !z.string().uuid().safeParse(logId).success
  ) {
    notFound();
  }
  const bike = await getGarageBike(user.id, id);
  const log = bike?.logs.find((entry) => entry.id === logId);
  if (!bike || !log || bike.ownership_ended_on || bike.retired_on) notFound();

  return (
    <div className="account-page shell">
      <AccountNavigation />
      <Link className="back-link" href={`/mine-cykler/${bike.id}#historik`}>
        ← Tilbage til historikken
      </Link>
      <header className="account-heading">
        <p className="eyebrow">Auditvenlig rettelse</p>
        <h1>Ret logpost</h1>
        <p>
          Den tidligere version gemmes i revisionshistorikken sammen med din
          begrundelse. En fejl slettes ikke lydløst.
        </p>
      </header>
      {query.fejl && (
        <p className="form-message form-message--error" role="alert">
          Logposten kunne ikke ændres. Kontrollér felterne og begrundelsen.
        </p>
      )}
      <form
        action={correctBikeLogAction.bind(null, bike.id, log.id)}
        className="account-card stacked-form"
      >
        <div className="form-grid form-grid--two">
          <label>
            Type
            <select defaultValue={log.log_type} name="logType">
              {bikeLogTypes.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </label>
          <label>
            Dato
            <input
              defaultValue={log.occurred_on}
              max={new Date().toISOString().slice(0, 10)}
              name="occurredOn"
              required
              type="date"
            />
          </label>
          <label className="form-field--wide">
            Titel
            <input defaultValue={log.title} maxLength={120} minLength={3} name="title" required />
          </label>
          <label>
            Turens km
            <input defaultValue={log.distance_km ?? ""} min={0} name="distanceKm" type="number" />
          </label>
          <label>
            Odometer
            <input defaultValue={log.odometer_km ?? ""} min={0} name="odometerKm" type="number" />
          </label>
          <label>
            Pris kr.
            <input defaultValue={log.cost_dkk ?? ""} min={0} name="costDkk" type="number" />
          </label>
          <label>
            Komponent
            <select defaultValue={log.component_category ?? ""} name="componentCategory">
              <option value="">Ikke relevant</option>
              {componentCategories.map((component) => (
                <option key={component.value} value={component.value}>
                  {component.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Komponentmærke
            <input defaultValue={log.component_brand ?? ""} maxLength={60} name="componentBrand" />
          </label>
          <label>
            Komponentmodel
            <input defaultValue={log.component_model ?? ""} maxLength={100} name="componentModel" />
          </label>
        </div>
        <label>
          Noter
          <textarea defaultValue={log.details ?? ""} maxLength={5_000} name="details" rows={5} />
        </label>
        <label className="garage-log-check">
          <input defaultChecked={log.documentation_available} name="documentationAvailable" type="checkbox" />
          Bilag eller kvittering findes
        </label>
        <label>
          Begrund rettelsen
          <textarea
            maxLength={500}
            minLength={3}
            name="correctionReason"
            placeholder="Fx forkert kilometerstand indtastet"
            required
            rows={3}
          />
        </label>
        <button className="button button--accent" type="submit">Gem rettelse</button>
      </form>

      <form
        action={voidBikeLogAction.bind(null, bike.id, log.id)}
        className="account-card stacked-form"
      >
        <h2>Annullér fejlregistrering</h2>
        <p>
          Posten skjules fra den normale tidslinje, men originalen og årsagen
          bevares i auditsporet.
        </p>
        <label>
          Begrund annullering
          <input maxLength={500} minLength={3} name="correctionReason" required />
        </label>
        <button className="button button--quiet" type="submit">Annullér logpost</button>
      </form>
    </div>
  );
}
