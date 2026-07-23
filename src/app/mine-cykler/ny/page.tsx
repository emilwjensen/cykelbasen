import { createGarageBikeAction } from "@/features/garage/actions";
import { bikeCategories } from "@/features/listings/types";
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
      <header className="editor-heading">
        <p className="eyebrow">Mine cykler</p>
        <h1>Registrér din cykel.</h1>
        <p>
          Stelnummeret hashes før lagring og kan ikke læses tilbage. Det vises
          aldrig på en offentlig annonce.
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
            <label className="form-field">
              Mærke
              <input maxLength={60} name="brand" required />
            </label>
            <label className="form-field">
              Model
              <input maxLength={80} name="model" required />
            </label>
            <label className="form-field">
              Modelår
              <input max={2100} min={1950} name="modelYear" type="number" />
            </label>
            <label className="form-field">
              Stelstørrelse
              <input maxLength={20} name="frameSizeLabel" placeholder="Fx 56 / L" />
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
          <legend>Da du fik cyklen</legend>
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

        <div className="listing-form__submit">
          <div>
            <strong>Privat som standard</strong>
            <p>Kun din konto kan læse cyklen og dens logs.</p>
          </div>
          <button className="button button--accent" type="submit">
            Gem under Mine cykler
          </button>
        </div>
      </form>
    </div>
  );
}
