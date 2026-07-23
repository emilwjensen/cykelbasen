import Link from "next/link";
import { BrandSelect } from "@/features/bikes/components/brand-select";
import {
  acquisitionSources,
  groupsetBrands,
} from "@/features/bikes/catalog";
import { createGarageBikeAction } from "@/features/garage/actions";
import {
  bikeCategories,
  brakeTypes,
  frameMaterials,
} from "@/features/listings/types";
import { requireUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

type NewGarageBikePageProps = {
  searchParams: Promise<{ fejl?: string }>;
};

export default async function NewBikePage({
  searchParams,
}: NewGarageBikePageProps) {
  const [, params] = await Promise.all([requireUser(), searchParams]);

  return (
    <div className="editor-page shell">
      <Link className="back-link" href="/mine-cykler">
        <span aria-hidden="true">←</span> Mine cykler
      </Link>
      <header className="editor-heading">
        <p className="eyebrow">Mine cykler</p>
        <h1>Opret cyklens digitale pas.</h1>
        <p>
          Gem identitet, køb og tekniske data én gang. Du kan bagefter tilføje
          kvittering og andre private bilag, føre servicehistorik og genbruge
          oplysningerne i en salgsannonce.
        </p>
      </header>

      {params.fejl && (
        <p className="form-message form-message--error">
          Cyklen kunne ikke gemmes. Kontrollér felterne og prøv igen.
        </p>
      )}

      <form action={createGarageBikeAction} className="listing-form garage-form">
        <fieldset>
          <legend>Identitet</legend>
          <div className="form-grid form-grid--two">
            <label className="form-field form-field--wide">
              Kaldenavn
              <input
                maxLength={80}
                minLength={2}
                name="nickname"
                placeholder="Fx Sommer-raceren"
                required
              />
            </label>
            <label className="form-field">
              Type
              <select name="category" required>
                <option value="">Vælg type</option>
                {bikeCategories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>
            <BrandSelect />
            <label className="form-field">
              Model
              <input maxLength={80} name="model" required />
            </label>
            <label className="form-field">
              Modelår
              <input max={2100} min={1950} name="modelYear" type="number" />
            </label>
            <label className="form-field">
              Stelstørrelse, label
              <input maxLength={20} name="frameSizeLabel" placeholder="Fx 56 / L" />
            </label>
            <label className="form-field">
              Stelstørrelse i cm
              <input max={70} min={35} name="frameSizeCm" type="number" />
            </label>
            <label className="form-field">
              Farve
              <input maxLength={40} name="color" placeholder="Fx mat sort" />
            </label>
            <label className="form-field">
              Stelnummer, valgfrit og privat
              <input
                autoComplete="off"
                maxLength={120}
                name="serialNumber"
                type="password"
              />
              <small>Gemmes kun som en envejs-hash.</small>
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Tekniske specifikationer</legend>
          <p className="form-help">
            Strukturerede data gør service, senere salg og sammenligning mere
            præcis. Du kan altid rette dem senere.
          </p>
          <div className="form-grid form-grid--three">
            <label className="form-field">
              Stelmateriale
              <select name="material">
                <option value="">Ikke angivet</option>
                {frameMaterials.map((material) => (
                  <option key={material.value} value={material.value}>
                    {material.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              Gearmærke
              <select name="groupsetBrand">
                <option value="">Ikke angivet</option>
                {groupsetBrands.map((brand) => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </label>
            <label className="form-field">
              Geargruppe
              <input maxLength={80} name="groupsetModel" placeholder="Fx Ultegra R8170" />
            </label>
            <label className="form-field">
              Drivlinje
              <input maxLength={20} name="drivetrain" placeholder="Fx 2x12" />
            </label>
            <label className="form-field">
              Bremsetype
              <select name="brakes">
                <option value="">Ikke angivet</option>
                {brakeTypes.map((brake) => (
                  <option key={brake.value} value={brake.value}>
                    {brake.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              Hjulstørrelse
              <input maxLength={30} name="wheelSize" placeholder="Fx 700C" />
            </label>
          </div>
          <div className="check-grid">
            <label className="check-field">
              <input name="electronicShifting" type="checkbox" />
              <span>
                <strong>Elektroniske gear</strong>
                <small>Fx Di2, AXS eller EPS</small>
              </span>
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Køb og ejerskab</legend>
          <div className="form-grid form-grid--three">
            <label className="form-field">
              Anskaffelsesdato
              <input
                max={new Date().toISOString().slice(0, 10)}
                name="acquiredOn"
                required
                type="date"
              />
            </label>
            <label className="form-field">
              Købt gennem
              <select name="acquisitionSource">
                <option value="">Ikke angivet</option>
                {acquisitionSources.map((source) => (
                  <option key={source.value} value={source.value}>
                    {source.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              Købssted eller sælger
              <input
                maxLength={120}
                name="purchaseLocation"
                placeholder="Fx Fri BikeShop Aarhus"
              />
            </label>
            <label className="form-field">
              Købspris i kr.
              <input min={0} name="purchasePriceDkk" type="number" />
              <small>Privat. Bruges senere til værdi- og vedligeholdsoverblik.</small>
            </label>
            <label className="form-field">
              Kendt ejer nummer
              <select defaultValue="1" name="ownerCountAtAcquisition">
                {Array.from({ length: 10 }, (_, index) => index + 1).map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </label>
            <label className="form-field">
              Kilometerstand nu
              <input defaultValue="0" min={0} name="currentOdometerKm" type="number" />
            </label>
          </div>
          <div className="check-grid">
            <label className="check-field">
              <input name="acquiredUsed" type="checkbox" />
              <span>
                <strong>Købt brugt</strong>
                <small>Du er ikke cyklens første ejer</small>
              </span>
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Private noter</legend>
          <label className="form-field">
            Det du vil huske om cyklen
            <textarea maxLength={5_000} name="notes" rows={6} />
          </label>
        </fieldset>

        <aside className="account-aside">
          <p className="account-aside__label">Næste trin</p>
          <h2>Dokumentér cyklen</h2>
          <p>
            Når cyklen er gemt, åbner dokumentområdet. Her kan du uploade
            kvittering, købsaftale, garanti, forsikring og servicebilag til den
            private dokument-store.
          </p>
        </aside>

        <div className="listing-form__submit">
          <div>
            <strong>Privat som standard</strong>
            <p>Kun din konto kan læse cyklen, logs og dokumenter.</p>
          </div>
          <button className="button button--accent" type="submit">
            Gem under Mine cykler
          </button>
        </div>
      </form>
    </div>
  );
}
