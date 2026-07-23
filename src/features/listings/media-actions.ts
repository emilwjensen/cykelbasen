"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  deleteListingImageBlob,
  deleteOwnershipDocumentBlob,
  MAX_LISTING_IMAGES,
  UploadValidationError,
  uploadListingImage,
  uploadOwnershipDocument,
  verifyListingImage,
  verifyOwnershipDocument,
} from "@/lib/blob-storage";
import { requireUser } from "@/lib/auth/server";
import { getApplicationDatabase } from "@/lib/database";
import { getListingMedia } from "./media-queries";

const idSchema = z.string().uuid();

function mediaUrl(listingId: string, result: string) {
  return `/annoncer/${listingId}/rediger?media=${encodeURIComponent(result)}#annoncefiler`;
}

function isRateLimited(error: unknown, action: string) {
  return (
    error instanceof Error &&
    error.message.includes(`RATE_LIMIT:${action}`)
  );
}

function refreshListingMedia(listingId: string) {
  revalidatePath(`/annoncer/${listingId}/rediger`);
  revalidatePath("/mine-annoncer");
  revalidatePath("/cykler");
  revalidatePath(`/cykler/${listingId}`);
}

export async function uploadListingImagesAction(
  listingId: string,
  formData: FormData,
) {
  const user = await requireUser();
  const validListingId = idSchema.safeParse(listingId);
  if (!validListingId.success) redirect("/mine-annoncer?fejl=media");

  const media = await getListingMedia(user.id, validListingId.data);
  if (!media || !["draft", "rejected"].includes(media.listingStatus)) {
    redirect("/mine-annoncer?fejl=media");
  }

  const files = formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (!files.length) redirect(mediaUrl(validListingId.data, "vaelg-billede"));
  if (media.images.length + files.length > MAX_LISTING_IMAGES) {
    redirect(mediaUrl(validListingId.data, "for-mange-billeder"));
  }

  let verifiedUploads: Awaited<ReturnType<typeof verifyListingImage>>[];
  try {
    verifiedUploads = await Promise.all(files.map(verifyListingImage));
  } catch (error) {
    redirect(
      mediaUrl(
        validListingId.data,
        error instanceof UploadValidationError ? "ugyldigt-billede" : "fejl",
      ),
    );
  }

  const blobs: Awaited<ReturnType<typeof uploadListingImage>>[] = [];
  try {
    for (const upload of verifiedUploads) {
      blobs.push(
        await uploadListingImage(user.id, validListingId.data, upload),
      );
    }

    const database = getApplicationDatabase();
    await database.transaction((transaction) => [
      transaction`select set_config('app.user_id', ${user.id}, true)`,
      transaction`
        select id
        from public.listings
        where id = ${validListingId.data}::uuid
          and seller_id = ${user.id}
          and status in ('draft', 'rejected')
        for update
      `,
      ...blobs.map(
        (blob, index) => transaction`
          insert into public.listing_images (
            listing_id,
            object_key,
            image_url,
            alt_text,
            position,
            original_filename,
            content_type,
            size_bytes
          )
          values (
            ${validListingId.data}::uuid,
            ${blob.pathname},
            ${blob.url},
            ${`${media.listingTitle} – billede ${media.images.length + index + 1}`},
            (
              select coalesce(max(image.position) + 1, 0)::smallint
              from public.listing_images image
              where image.listing_id = ${validListingId.data}::uuid
            ),
            ${verifiedUploads[index]!.originalFilename},
            ${verifiedUploads[index]!.contentType},
            ${verifiedUploads[index]!.sizeBytes}
          )
        `,
      ),
    ]);
  } catch (error) {
    await Promise.allSettled(
      blobs.map((blob) => deleteListingImageBlob(blob.pathname)),
    );
    redirect(
      mediaUrl(
        validListingId.data,
        isRateLimited(error, "listing-image") ? "begraenset" : "fejl",
      ),
    );
  }

  refreshListingMedia(validListingId.data);
  redirect(mediaUrl(validListingId.data, "billeder-gemt"));
}

export async function moveListingImageAction(
  listingId: string,
  imageId: string,
  direction: "up" | "down",
) {
  const user = await requireUser();
  const parsed = z
    .object({
      listingId: idSchema,
      imageId: idSchema,
      direction: z.enum(["up", "down"]),
    })
    .safeParse({ listingId, imageId, direction });
  if (!parsed.success) redirect("/mine-annoncer?fejl=media");

  const database = getApplicationDatabase();
  const results = await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${user.id}, true)`,
    transaction`
      select public.move_listing_image(
        ${parsed.data.imageId}::uuid,
        ${parsed.data.direction}
      ) as moved
    `,
  ]);
  const moved = (results[1] as unknown as Array<{ moved: boolean }>)[0]?.moved;
  if (!moved) redirect(mediaUrl(parsed.data.listingId, "fejl"));

  refreshListingMedia(parsed.data.listingId);
  redirect(mediaUrl(parsed.data.listingId, "raekkefoelge-gemt"));
}

export async function deleteListingImageAction(
  listingId: string,
  imageId: string,
) {
  const user = await requireUser();
  const parsed = z
    .object({ listingId: idSchema, imageId: idSchema })
    .safeParse({ listingId, imageId });
  if (!parsed.success) redirect("/mine-annoncer?fejl=media");

  const database = getApplicationDatabase();
  const results = await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${user.id}, true)`,
    transaction`
      select public.delete_listing_image(
        ${parsed.data.imageId}::uuid
      ) as object_key
    `,
  ]);
  const objectKey = (
    results[1] as unknown as Array<{ object_key: string | null }>
  )[0]?.object_key;
  if (!objectKey) redirect(mediaUrl(parsed.data.listingId, "fejl"));

  try {
    await deleteListingImageBlob(objectKey);
  } catch {
    // Metadata is already removed. Operations can reconcile an orphaned object.
  }

  refreshListingMedia(parsed.data.listingId);
  redirect(mediaUrl(parsed.data.listingId, "billede-slettet"));
}

export async function uploadOwnershipDocumentAction(
  listingId: string,
  formData: FormData,
) {
  const user = await requireUser();
  const validListingId = idSchema.safeParse(listingId);
  if (!validListingId.success) redirect("/mine-annoncer?fejl=media");

  const media = await getListingMedia(user.id, validListingId.data);
  if (!media || !["draft", "rejected"].includes(media.listingStatus)) {
    redirect("/mine-annoncer?fejl=media");
  }
  if (media.documents.some((document) => document.status === "pending")) {
    redirect(mediaUrl(validListingId.data, "dokument-findes"));
  }

  const file = formData.get("document");
  let verifiedUpload: Awaited<ReturnType<typeof verifyOwnershipDocument>>;
  try {
    verifiedUpload = await verifyOwnershipDocument(
      file instanceof File ? file : "",
    );
  } catch (error) {
    redirect(
      mediaUrl(
        validListingId.data,
        error instanceof UploadValidationError ? "ugyldigt-dokument" : "fejl",
      ),
    );
  }

  const frameNumber = z
    .string()
    .trim()
    .max(120)
    .safeParse(formData.get("frameNumber"));
  if (!frameNumber.success) {
    redirect(mediaUrl(validListingId.data, "ugyldigt-stelnummer"));
  }
  const normalizedFrameNumber = frameNumber.data
    ? frameNumber.data.toUpperCase().replace(/[\s-]+/g, "")
    : null;
  const frameNumberHash = normalizedFrameNumber
    ? createHash("sha256").update(normalizedFrameNumber).digest("hex")
    : null;

  let blob: Awaited<ReturnType<typeof uploadOwnershipDocument>> | undefined;
  try {
    const uploadedBlob = await uploadOwnershipDocument(
      user.id,
      validListingId.data,
      verifiedUpload,
    );
    blob = uploadedBlob;
    const database = getApplicationDatabase();
    await database.transaction((transaction) => [
      transaction`select set_config('app.user_id', ${user.id}, true)`,
      transaction`
        insert into public.ownership_documents (
          listing_id,
          owner_id,
          object_key,
          frame_number_hash,
          original_filename,
          content_type,
          size_bytes
        )
        values (
          ${validListingId.data}::uuid,
          ${user.id},
          ${uploadedBlob.pathname},
          ${frameNumberHash},
          ${verifiedUpload.originalFilename},
          ${verifiedUpload.contentType},
          ${verifiedUpload.sizeBytes}
        )
      `,
    ]);
  } catch (error) {
    if (blob) {
      await Promise.allSettled([deleteOwnershipDocumentBlob(blob.pathname)]);
    }
    redirect(
      mediaUrl(
        validListingId.data,
        isRateLimited(error, "ownership-document") ? "begraenset" : "fejl",
      ),
    );
  }

  refreshListingMedia(validListingId.data);
  revalidatePath("/admin/dokumentation");
  redirect(mediaUrl(validListingId.data, "dokument-gemt"));
}

export async function deleteOwnershipDocumentAction(
  listingId: string,
  documentId: string,
) {
  const user = await requireUser();
  const parsed = z
    .object({ listingId: idSchema, documentId: idSchema })
    .safeParse({ listingId, documentId });
  if (!parsed.success) redirect("/mine-annoncer?fejl=media");

  const database = getApplicationDatabase();
  const results = await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${user.id}, true)`,
    transaction`
      select public.delete_ownership_document(
        ${parsed.data.documentId}::uuid
      ) as object_key
    `,
  ]);
  const objectKey = (
    results[1] as unknown as Array<{ object_key: string | null }>
  )[0]?.object_key;
  if (!objectKey) redirect(mediaUrl(parsed.data.listingId, "fejl"));

  try {
    await deleteOwnershipDocumentBlob(objectKey);
  } catch {
    // Metadata is already removed. Operations can reconcile an orphaned object.
  }

  refreshListingMedia(parsed.data.listingId);
  revalidatePath("/admin/dokumentation");
  redirect(mediaUrl(parsed.data.listingId, "dokument-slettet"));
}
