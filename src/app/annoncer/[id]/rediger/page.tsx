import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { ListingForm } from "@/features/listings/components/listing-form";
import { ListingMediaManager } from "@/features/listings/components/listing-media-manager";
import { updateDraftAction } from "@/features/listings/draft-actions";
import { getEditableListing } from "@/features/listings/draft-queries";
import { getListingMedia } from "@/features/listings/media-queries";
import { requireUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

type EditListingPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ media?: string }>;
};

export default async function EditListingPage({
  params,
  searchParams,
}: EditListingPageProps) {
  const [user, { id }, query] = await Promise.all([
    requireUser(),
    params,
    searchParams,
  ]);

  if (!z.string().uuid().safeParse(id).success) notFound();

  const [listing, media] = await Promise.all([
    getEditableListing(user.id, id),
    getListingMedia(user.id, id),
  ]);
  if (!listing || !media) notFound();

  const action = updateDraftAction.bind(null, listing.id);

  return (
    <div className="editor-page shell">
      <Link className="back-link" href="/mine-annoncer">
        <span aria-hidden="true">←</span> Mine annoncer
      </Link>
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
      <ListingMediaManager
        listingId={listing.id}
        media={media}
        messageCode={query.media}
      />
    </div>
  );
}
