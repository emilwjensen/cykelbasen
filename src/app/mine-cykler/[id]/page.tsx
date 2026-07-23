import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { createBikeLogAction } from "@/features/garage/actions";
import { BikeTransferForm } from "@/features/garage/components/bike-transfer-form";
import { getGarageBike } from "@/features/garage/queries";
import { bikeLogTypes } from "@/features/garage/types";
import {
  categoryLabel,
  formatDate,
  formatPrice,
} from "@/features/listings/format";
import { componentCategories } from "@/features/listings/types";
import { requireUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

const logTypeLabels = Object.fromEntries(
  bikeLogTypes.map((type) => [type.value, type.label]),
);
const componentLabels = Object.fromEntries(
  componentCategories.map((type) => [type.value, type.label]),
);

type MyBikePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    oprettet?: string;
    logget?: string;
    overtaget?: string;
    fejl?: string;
  }>;
};

export default async function MyBikePage({
  params,
  searchParams,
}: MyBikePageProps) {
  const [{ id }, query, user] = await Promise.all([
    params,
    searchParams,
    requireUser(),
  ]);
  if (!z.string().uuid().safeParse(id).success) notFound();

  const bike = await getGarageBike(user.id, id);
  if (!bike) notFound();

  return (
    <div className="garage-detail shell">
      <Link className="back-link" href="/mine-cykler">
        ← Mine cykler
      </Link>

      <header className="garage-detail__hero">
        <div>
          <p className="eyebrow">{categoryLabel(bike.category)}</p>
          <h1>{bike.nickname}</h1>
          <p>
            {bike.brand} {bike.model}
            {bike.model_year ? ` · ${bike.model_year}` : ""}
            {bike.frame_size_label ? ` · str. ${bike.frame_size_label}` : ""}
          </p>
        </div>
        <div className="garage-odometer">
          <strong>{bike.current_odometer_km.toLocaleString("da-DK")}</strong>
          <span>registrerede km</span>
          {bike.ownership_ended_on ? (
            <span className="status">Tidligere ejerperiode</span>
          ) : (
            <Link
              className="button button--accent garage-sell-link"
              href={`/annoncer/ny?cykel=${bike.id}`}
            >
              Opret salgsannonce
            </Link>
          )}
        </div>
      </header>

      {(query.oprettet || query.logget || query.overtaget) && (
        <p className="form-message form-message--success">
          {query.overtaget
            ? "Cyklen er overtaget, og ejerhistorikken er forbundet."
            : query.oprettet
              ? "Cyklen er registreret."
              : "Logposten er tilføjet."}
        </p>
      )}
      {query.fejl && (
        <p className="form-message form-message--error">
          Logposten kunne ikke gemmes. Kontrollér felterne.
        </p>
      )}

      <div className="garage-facts">
        <div>
          <span>Anskaffet</span>
          <strong>{formatDate(bike.acquired_on)}</strong>
        </div>
        <div>
          <span>Ejerhistorik</span>
          <strong>{bike.ownership_history.length} registrerede ejerperioder</strong>
        </div>
        <div>
          <span>Stelnummer</span>
          <strong>{bike.has_serial_number ? "Hash registreret" : "Ikke registreret"}</strong>
        </div>
        <div>
          <span>Historik</span>
          <strong>{bike.log_count} logposter</strong>
        </div>
      </div>

      <section className="ownership-chain">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Ejerskabskæde</p>
            <h2>Registrerede ejerperioder</h2>
          </div>
          <p>
            Historikken viser kun perioder, der er forbundet gennem en sikker
            overdragelse. Private noter og logs deles aldrig.
          </p>
        </div>
        <ol>
          {bike.ownership_history.map((period) => (
            <li
              className={period.is_this_registration ? "is-current-user" : ""}
              key={period.owner_sequence}
            >
              <span>{period.owner_sequence}</span>
              <div>
                <strong>
                  {period.is_this_registration
                    ? "Din ejerperiode"
                    : "Registreret ejerperiode"}
                </strong>
                <p>
                  {formatDate(period.started_on)} –{" "}
                  {period.ended_on ? formatDate(period.ended_on) : "nu"}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="garage-detail__grid">
        <section id="historik">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Cykellog</p>
              <h2>Historik</h2>
            </div>
          </div>
          {bike.logs.length ? (
            <div className="bike-log-list">
              {bike.logs.map((log) => (
                <article key={log.id}>
                  <div className="bike-log-list__marker" />
                  <div>
                    <header>
                      <span>{logTypeLabels[log.log_type]}</span>
                      <time>{formatDate(log.occurred_on)}</time>
                    </header>
                    <h3>{log.title}</h3>
                    {log.details && <p>{log.details}</p>}
                    <div className="bike-log-list__facts">
                      {log.distance_km !== null && <span>{log.distance_km} km</span>}
                      {log.odometer_km !== null && (
                        <span>Odometer {log.odometer_km.toLocaleString("da-DK")} km</span>
                      )}
                      {log.cost_dkk !== null && <span>{formatPrice(log.cost_dkk)}</span>}
                      {log.component_category && (
                        <span>
                          {componentLabels[log.component_category]}
                          {log.component_model
                            ? ` · ${[log.component_brand, log.component_model]
                                .filter(Boolean)
                                .join(" ")}`
                            : ""}
                        </span>
                      )}
                      {log.documentation_available && <strong>Bilag findes</strong>}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="component-history__empty">Ingen logposter endnu.</p>
          )}
        </section>

        <div className="garage-side-stack">
          {bike.ownership_ended_on ? (
            <aside className="garage-log-panel">
              <p className="eyebrow">Afsluttet ejerperiode</p>
              <h2>Historikken er låst</h2>
              <p>
                Du beholder adgang til dine private data, men kan ikke tilføje
                nye logs efter overdragelsen.
              </p>
            </aside>
          ) : (
            <aside className="garage-log-panel" id="ny-log">
              <p className="eyebrow">Hold data opdateret</p>
              <h2>Tilføj logpost</h2>
              <form action={createBikeLogAction.bind(null, bike.id)}>
                <label>
                  Type
                  <select name="logType" required>
                    {bikeLogTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Titel
                  <input maxLength={120} minLength={3} name="title" required />
                </label>
                <label>
                  Dato
                  <input
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    max={new Date().toISOString().slice(0, 10)}
                    name="occurredOn"
                    required
                    type="date"
                  />
                </label>
                <div className="garage-log-panel__row">
                  <label>
                    Turens km
                    <input min={0} name="distanceKm" type="number" />
                  </label>
                  <label>
                    Odometer
                    <input min={0} name="odometerKm" type="number" />
                  </label>
                  <label>
                    Pris kr.
                    <input min={0} name="costDkk" type="number" />
                  </label>
                </div>
                <label>
                  Komponent
                  <select name="componentCategory">
                    <option value="">Ikke relevant</option>
                    {componentCategories.map((component) => (
                      <option key={component.value} value={component.value}>
                        {component.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="garage-log-panel__row garage-log-panel__row--two">
                  <label>
                    Mærke
                    <input maxLength={60} name="componentBrand" />
                  </label>
                  <label>
                    Model
                    <input maxLength={100} name="componentModel" />
                  </label>
                </div>
                <label>
                  Noter
                  <textarea maxLength={5_000} name="details" rows={5} />
                </label>
                <label className="garage-log-check">
                  <input name="documentationAvailable" type="checkbox" />
                  Bilag eller kvittering findes
                </label>
                <button className="button button--accent" type="submit">
                  Gem logpost
                </button>
              </form>
            </aside>
          )}
          {!bike.ownership_ended_on && <BikeTransferForm bikeId={bike.id} />}
        </div>
      </div>
    </div>
  );
}
