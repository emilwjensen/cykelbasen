import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import {
  addListingComponentChangeAction,
  deleteListingComponentChangeAction,
} from "@/features/listings/component-actions";
import { getListingComponentEditor } from "@/features/listings/component-queries";
import { formatDate } from "@/features/listings/format";
import { componentCategories } from "@/features/listings/types";
import { requireUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

const categoryLabels = Object.fromEntries(
  componentCategories.map((category) => [category.value, category.label]),
);

type ComponentEditorPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ gemt?: string; fejl?: string }>;
};

export default async function ComponentEditorPage({
  params,
  searchParams,
}: ComponentEditorPageProps) {
  const [{ id }, query, user] = await Promise.all([
    params,
    searchParams,
    requireUser(),
  ]);
  if (!z.string().uuid().safeParse(id).success) notFound();

  const listing = await getListingComponentEditor(user.id, id);
  if (!listing) notFound();

  return (
    <div className="editor-page shell">
      <Link className="back-link" href="/mine-annoncer">
        ← Mine annoncer
      </Link>
      <header className="editor-heading component-editor-heading">
        <p className="eyebrow">Komponenthistorik</p>
        <h1>{listing.title}</h1>
        <p>
          Registrér udskiftninger enkeltvis. Det giver køberen et mere præcist
          billede end en lang fritekst.
        </p>
      </header>

      {query.gemt && (
        <p className="form-message form-message--success">
          Komponentændringen er gemt.
        </p>
      )}
      {query.fejl && (
        <p className="form-message form-message--error">
          Ændringen kunne ikke gemmes. Kontrollér felterne.
        </p>
      )}

      <div className="component-editor-grid">
        <form
          action={addListingComponentChangeAction.bind(null, listing.id)}
          className="account-card component-change-form"
        >
          <h2>Tilføj udskiftning</h2>
          <label>
            Komponenttype
            <select name="category" required>
              {componentCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tidligere komponent
            <input maxLength={160} name="previousComponent" />
          </label>
          <div>
            <label>
              Nyt mærke
              <input maxLength={60} name="replacementBrand" />
            </label>
            <label>
              Ny model
              <input maxLength={120} minLength={2} name="replacementModel" required />
            </label>
          </div>
          <label>
            Dato
            <input
              max={new Date().toISOString().slice(0, 10)}
              name="changedOn"
              type="date"
            />
          </label>
          <label>
            Noter
            <textarea maxLength={2_000} name="notes" rows={4} />
          </label>
          <label className="garage-log-check">
            <input name="documentationAvailable" type="checkbox" />
            Kvittering eller bilag findes
          </label>
          <button className="button button--accent" type="submit">
            Tilføj komponent
          </button>
        </form>

        <section>
          <h2>Registrerede ændringer</h2>
          {listing.changes.length ? (
            <div className="component-editor-list">
              {listing.changes.map((change) => (
                <article key={change.id}>
                  <div>
                    <span>{categoryLabels[change.category]}</span>
                    {change.changed_on && <time>{formatDate(change.changed_on)}</time>}
                  </div>
                  <h3>
                    {[change.replacement_brand, change.replacement_model]
                      .filter(Boolean)
                      .join(" ")}
                  </h3>
                  {change.previous_component && (
                    <p>Erstatter {change.previous_component}</p>
                  )}
                  {change.notes && <p>{change.notes}</p>}
                  <form
                    action={deleteListingComponentChangeAction.bind(
                      null,
                      listing.id,
                      change.id,
                    )}
                  >
                    <button className="text-button" type="submit">
                      Fjern
                    </button>
                  </form>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>Ingen komponentudskiftninger registreret endnu.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
