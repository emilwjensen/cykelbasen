import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AccountNavigation } from "@/components/account-navigation";
import {
  acquisitionSources,
  groupsetBrands,
} from "@/features/bikes/catalog";
import { BrandSelect } from "@/features/bikes/components/brand-select";
import { updateGarageBikeAction } from "@/features/garage/actions";
import { getGarageBike } from "@/features/garage/queries";
import {
  bikeCategories,
  brakeTypes,
  frameMaterials,
} from "@/features/listings/types";
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
          Ret cykelpassets identitet, specs og købsdata. Kilometer og historik
          vedligeholdes gennem logposter, så tidslinjen forbliver sporbar.
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
          <BrandSelect defaultBrand={bike.brand} />
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
            Stelstørrelse, label
            <input
              defaultValue={bike.frame_size_label ?? ""}
              maxLength={20}
              name="frameSizeLabel"
            />
          </label>
          <label>
            Stelstørrelse i cm
            <input
              defaultValue={bike.frame_size_cm ?? ""}
              max={70}
              min={35}
              name="frameSizeCm"
              type="number"
            />
          </label>
          <label>
            Farve
            <input defaultValue={bike.color ?? ""} maxLength={40} name="color" />
          </label>
          <label>
            Stelmateriale
            <select defaultValue={bike.material ?? ""} name="material">
              <option value="">Ikke angivet</option>
              {frameMaterials.map((material) => (
                <option key={material.value} value={material.value}>
                  {material.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Gearmærke
            <select defaultValue={bike.groupset_brand ?? ""} name="groupsetBrand">
              <option value="">Ikke angivet</option>
              {groupsetBrands.map((brand) => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </label>
          <label>
            Geargruppe
            <input
              defaultValue={bike.groupset_model ?? ""}
              maxLength={80}
              name="groupsetModel"
            />
          </label>
          <label>
            Drivlinje
            <input
              defaultValue={bike.drivetrain ?? ""}
              maxLength={20}
              name="drivetrain"
              placeholder="Fx 2x12"
            />
          </label>
          <label>
            Bremsetype
            <select defaultValue={bike.brakes ?? ""} name="brakes">
              <option value="">Ikke angivet</option>
              {brakeTypes.map((brake) => (
                <option key={brake.value} value={brake.value}>
                  {brake.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Hjulstørrelse
            <input
              defaultValue={bike.wheel_size ?? ""}
              maxLength={30}
              name="wheelSize"
            />
          </label>
          <label>
            Købt gennem
            <select
              defaultValue={bike.acquisition_source ?? ""}
              name="acquisitionSource"
            >
              <option value="">Ikke angivet</option>
              {acquisitionSources.map((source) => (
                <option key={source.value} value={source.value}>
                  {source.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Købssted eller sælger
            <input
              defaultValue={bike.purchase_location ?? ""}
              maxLength={120}
              name="purchaseLocation"
            />
          </label>
          <label>
            Købspris i kr.
            <input
              defaultValue={bike.purchase_price_dkk ?? ""}
              min={0}
              name="purchasePriceDkk"
              type="number"
            />
          </label>
        </div>
        <label className="garage-log-check">
          <input
            defaultChecked={bike.electronic_shifting}
            name="electronicShifting"
            type="checkbox"
          />
          Elektroniske gear
        </label>
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
