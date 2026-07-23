import { notFound } from "next/navigation";
import { z } from "zod";
import { ListingForm } from "@/features/listings/components/listing-form";
import { updateDraftAction } from "@/features/listings/draft-actions";
import { getEditableListing } from "@/features/listings/draft-queries";
import { requireUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

type EditListingPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditListingPage({
  params,
}: EditListingPageProps) {
  const [user, { id }] = await Promise.all([requireUser(), params]);

  if (!z.string().uuid().safeParse(id).success) notFound();

  const listing = await getEditableListing(user.id, id);
  if (!listing) notFound();

  const action = updateDraftAction.bind(null, listing.id);

  return (
    <div className="editor-page shell">
      <header className="editor-heading">
        <p className="eyebrow">Redigér kladde</p>
        <h1>{listing.title}</h1>
        <p>
          Ændringer gemmes som kladde. En afvist annonce sættes tilbage til
          kladde, når den gemmes.
        </p>
      </header>
      <ListingForm
        action={action}
        initialValues={listing}
        submitLabel="Gem ændringer"
      />
    </div>
  );
}

