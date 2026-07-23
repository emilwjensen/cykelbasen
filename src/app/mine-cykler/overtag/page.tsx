import Link from "next/link";
import { acceptBikeTransferAction } from "@/features/garage/actions";
import { requireUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

type AcceptBikeTransferPageProps = {
  searchParams: Promise<{
    kode?: string;
    fejl?: string;
  }>;
};

export default async function AcceptBikeTransferPage({
  searchParams,
}: AcceptBikeTransferPageProps) {
  const [, query] = await Promise.all([requireUser(), searchParams]);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="editor-page shell">
      <Link className="back-link" href="/mine-cykler">
        ← Mine cykler
      </Link>
      <header className="editor-heading">
        <p className="eyebrow">Ejerskabskæde</p>
        <h1>Overtag en registreret cykel.</h1>
        <p>
          Indtast koden fra sælgeren. Du får din egen private cykelprofil, mens
          platformen forbinder de registrerede ejerperioder.
        </p>
      </header>

      {query.fejl && (
        <p className="form-message form-message--error">
          {query.fejl === "kode"
            ? "Koden er ugyldig, udløbet eller cyklen er allerede overdraget."
            : "Kontrollér kode, dato og kilometerstand."}
        </p>
      )}

      <form
        action={acceptBikeTransferAction}
        className="listing-form transfer-accept-form"
      >
        <fieldset>
          <legend>Din overtagelse</legend>
          <div className="form-grid form-grid--two">
            <label className="form-field form-field--wide">
              Overdragelseskode
              <input
                autoComplete="off"
                defaultValue={query.kode ?? ""}
                maxLength={200}
                minLength={24}
                name="token"
                required
              />
            </label>
            <label className="form-field">
              Købsdato
              <input
                defaultValue={today}
                max={today}
                name="acquiredOn"
                required
                type="date"
              />
            </label>
            <label className="form-field">
              Kilometerstand ved køb
              <input
                min={0}
                name="currentOdometerKm"
                placeholder="Fx 5200"
                required
                type="number"
              />
              <small>Må ikke være lavere end sælgerens seneste registrering.</small>
            </label>
          </div>
        </fieldset>
        <div className="listing-form__submit">
          <div>
            <strong>Private data bliver adskilt</strong>
            <p>Du overtager ikke sælgerens noter, kvitteringer eller turlogs.</p>
          </div>
          <button className="button button--accent" type="submit">
            Overtag cykel
          </button>
        </div>
      </form>
    </div>
  );
}
