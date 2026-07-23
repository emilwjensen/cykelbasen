import { redirect } from "next/navigation";
import { ListingForm } from "@/features/listings/components/listing-form";
import { createDraftAction } from "@/features/listings/draft-actions";
import { getProfile } from "@/features/profiles/queries";
import { requireUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function NewListingPage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);

  if (!profile) redirect("/profil?ny=1");

  return (
    <div className="editor-page shell">
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
        initialValues={{ city: profile.city ?? "" }}
        submitLabel="Gem kladde"
      />
    </div>
  );
}

