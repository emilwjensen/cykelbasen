import Link from "next/link";
import { redirect } from "next/navigation";
import { ListingForm } from "@/features/listings/components/listing-form";
import { createDraftAction } from "@/features/listings/draft-actions";
import { getProfile } from "@/features/profiles/queries";
import { requireUser } from "@/lib/auth/server";
import { getGarageBike } from "@/features/garage/queries";
import { z } from "zod";

export const dynamic = "force-dynamic";

type NewListingPageProps = {
  searchParams: Promise<{ cykel?: string }>;
};

export default async function NewListingPage({
  searchParams,
}: NewListingPageProps) {
  const [user, query] = await Promise.all([requireUser(), searchParams]);
  const garageBikeId = z.string().uuid().safeParse(query.cykel);
  const [profile, garageBike] = await Promise.all([
    getProfile(user.id),
    garageBikeId.success
      ? getGarageBike(user.id, garageBikeId.data)
      : Promise.resolve(null),
  ]);

  if (!profile) redirect("/profil?ny=1");

  const garageInitialValues = garageBike
    ? {
        garageBikeId: garageBike.id,
        title: `${garageBike.brand} ${garageBike.model}`,
        category: garageBike.category,
        brand: garageBike.brand,
        model: garageBike.model,
        modelYear: garageBike.model_year ?? undefined,
        frameSizeLabel: garageBike.frame_size_label ?? undefined,
        purchaseDate: garageBike.acquired_on,
        ownerCount: garageBike.owner_count_at_acquisition,
        serviceHistoryAvailable: garageBike.log_count > 0,
      }
    : {};

  return (
    <div className="editor-page shell">
      <Link className="back-link" href="/mine-annoncer">
        <span aria-hidden="true">←</span> Mine annoncer
      </Link>
      <header className="editor-heading">
        <p className="eyebrow">Ny annonce</p>
        <h1>Beskriv cyklen enkelt og præcist.</h1>
        <p>
          De strukturerede felter gør det muligt for købere at finde og
          sammenligne din cykel.
        </p>
      </header>
      <ListingForm
        action={createDraftAction}
        initialValues={{ city: profile.city ?? "", ...garageInitialValues }}
        submitLabel="Gem kladde"
      />
    </div>
  );
}
