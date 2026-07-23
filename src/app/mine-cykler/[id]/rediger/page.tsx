import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AccountNavigation } from "@/components/account-navigation";
import { updateGarageBikeAction } from "@/features/garage/actions";
import { getGarageBike } from "@/features/garage/queries";
import { bikeCategories } from "@/features/listings/types";
import { requireUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

type EditBikePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fejl?: string }>;
};

export default async function EditBikePage({
  params,
  searchParams,
}: EditBikePageProps) {
  const [user, { id }, query] = await Promise.all([
    requireUser(),
    params,
    searchParams,
  ]);
  if (!z.string().uuid().safeParse(id).success) notFound();

  const bike = await getGarageBike(user.id, id);
  if (!bike || bike.ownership_ended_on) notFound();

  return (
    <div className="account-page shell">
      <AccountNavigation />
      <Link className="back-link" href={`/mine-cykler/${bike.id}`}>
        ← Tilbage til cyklen
      </Link>
      <header className="account-heading">
        <p className="eyebrow">Mine cykler</p>
        <h1>Redigér {bike.nickname}</h1>
        <p>
          Ret identitet og private noter. Kilometer og historik vedligeholdes
          gennem logposter, så tidslinjen forbliver sporbar.
        </p>
      </header>

      {query.fejl && (
        <p className="form-message form-message--error" role="alert">
          {query.fejl === "laast"
            ? "En afsluttet ejerperiode kan ikke ændres."
            : "Kontrollér de udfyldte felter."}
        </p>
      )}

      <form
        action={updateGarageBikeAction.bind(null, bike.id)}
        className="account-card stacked-form"
      >
        <label>
          Kaldenavn
          <input
            defaultValue={bike.nickname}
            maxLength={80}
            minLength={2}
            name="nickname"
            required
          />
        </label>
        <div className="form-grid form-grid--two">
          <label>
            Type
            <select defaultValue={bike.category} name="category" required>
              {bikeCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Mærke
            <input
              defaultValue={bike.brand}
              maxLength={60}
              name="brand"
              required
            />
          </label>
          <label>
            Model
            <input
              defaultValue={bike.model}
              maxLength={80}
              name="model"
              required
            />
          </label>
          <label>
            Modelår
            <input
              defaultValue={bike.model_year ?? ""}
              max={2100}
              min={1950}
              name="modelYear"
              type="number"
            />
          </label>
          <label>
            Stelstørrelse
            <input
              defaultValue={bike.frame_size_label ?? ""}
              maxLength={20}
              name="frameSizeLabel"
            />
          </label>
        </div>
        <label>
          Private noter
          <textarea
            defaultValue={bike.notes ?? ""}
            maxLength={5_000}
            name="notes"
            rows={6}
          />
        </label>
        <div className="form-actions">
          <button className="button button--accent" type="submit">
            Gem cykeldata
          </button>
          <Link className="button button--quiet" href={`/mine-cykler/${bike.id}`}>
            Annullér
          </Link>
        </div>
      </form>
    </div>
  );
}

