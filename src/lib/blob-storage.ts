import "server-only";

import {
  del,
  issueSignedToken,
  presignUrl,
  put,
  type PutBlobResult,
} from "@vercel/blob";
import { randomUUID } from "node:crypto";

export const MAX_LISTING_IMAGES = 8;
export const MAX_LISTING_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_OWNERSHIP_DOCUMENT_BYTES = 10 * 1024 * 1024;

type UploadKind = "listing-image" | "ownership-document";

type VerifiedUpload = {
  contentType: string;
  extension: string;
  file: File;
  originalFilename: string;
  sizeBytes: number;
};

export class UploadValidationError extends Error {}

function tokenFor(kind: UploadKind) {
  const token =
    kind === "listing-image"
      ? process.env.LISTING_IMAGES_BLOB_READ_WRITE_TOKEN
      : process.env.OWNERSHIP_DOCUMENTS_BLOB_READ_WRITE_TOKEN;

  if (!token) {
    throw new Error(
      kind === "listing-image"
        ? "Listing-billedlageret er ikke konfigureret."
        : "Dokumentlageret er ikke konfigureret.",
    );
  }

  return token;
}

function safePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 100);
}

function bytesStartWith(bytes: Uint8Array, signature: number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

function detectedType(bytes: Uint8Array) {
  if (bytesStartWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (bytesStartWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "image/png";
  }
  if (
    bytesStartWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  if (bytesStartWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) {
    return "application/pdf";
  }
  return null;
}

const extensions: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

async function verifyFile(
  value: FormDataEntryValue,
  allowedTypes: string[],
  maximumBytes: number,
): Promise<VerifiedUpload> {
  if (!(value instanceof File) || value.size === 0) {
    throw new UploadValidationError("Vælg en fil.");
  }
  if (value.size > maximumBytes) {
    throw new UploadValidationError(
      `Filen må højst fylde ${Math.round(maximumBytes / 1024 / 1024)} MB.`,
    );
  }
  if (!allowedTypes.includes(value.type)) {
    throw new UploadValidationError("Filtypen er ikke understøttet.");
  }

  const signature = new Uint8Array(await value.slice(0, 12).arrayBuffer());
  const actualType = detectedType(signature);
  if (!actualType || actualType !== value.type) {
    throw new UploadValidationError(
      "Filens indhold svarer ikke til den angivne filtype.",
    );
  }

  return {
    contentType: actualType,
    extension: extensions[actualType],
    file: value,
    originalFilename: value.name.slice(0, 255),
    sizeBytes: value.size,
  };
}

export function verifyListingImage(value: FormDataEntryValue) {
  return verifyFile(
    value,
    ["image/jpeg", "image/png", "image/webp"],
    MAX_LISTING_IMAGE_BYTES,
  );
}

export function verifyOwnershipDocument(value: FormDataEntryValue) {
  return verifyFile(
    value,
    ["application/pdf", "image/jpeg", "image/png", "image/webp"],
    MAX_OWNERSHIP_DOCUMENT_BYTES,
  );
}

export async function uploadListingImage(
  userId: string,
  listingId: string,
  upload: VerifiedUpload,
): Promise<PutBlobResult> {
  const pathname = [
    "listing-images",
    safePathSegment(userId),
    listingId,
    `${randomUUID()}.${upload.extension}`,
  ].join("/");

  return put(pathname, upload.file, {
    access: "public",
    addRandomSuffix: false,
    cacheControlMaxAge: 60 * 60 * 24 * 30,
    contentType: upload.contentType,
    maximumSizeInBytes: MAX_LISTING_IMAGE_BYTES,
    token: tokenFor("listing-image"),
  });
}

export async function uploadOwnershipDocument(
  userId: string,
  listingId: string,
  upload: VerifiedUpload,
): Promise<PutBlobResult> {
  const pathname = [
    "ownership-documents",
    safePathSegment(userId),
    listingId,
    `${randomUUID()}.${upload.extension}`,
  ].join("/");

  return put(pathname, upload.file, {
    access: "private",
    addRandomSuffix: false,
    cacheControlMaxAge: 60,
    contentType: upload.contentType,
    maximumSizeInBytes: MAX_OWNERSHIP_DOCUMENT_BYTES,
    token: tokenFor("ownership-document"),
  });
}

export async function deleteListingImageBlob(pathname: string) {
  await del(pathname, { token: tokenFor("listing-image") });
}

export async function deleteOwnershipDocumentBlob(pathname: string) {
  await del(pathname, { token: tokenFor("ownership-document") });
}

export async function createOwnershipDocumentPreview(pathname: string) {
  const validUntil = Date.now() + 2 * 60 * 1000;
  const signedToken = await issueSignedToken({
    operations: ["get"],
    pathname,
    token: tokenFor("ownership-document"),
    validUntil,
  });

  const { presignedUrl } = await presignUrl(signedToken, {
    access: "private",
    operation: "get",
    pathname,
    useCache: false,
    validUntil,
  });

  return presignedUrl;
}

export function storageConfiguration() {
  return {
    listingImages: Boolean(process.env.LISTING_IMAGES_BLOB_READ_WRITE_TOKEN),
    ownershipDocuments: Boolean(
      process.env.OWNERSHIP_DOCUMENTS_BLOB_READ_WRITE_TOKEN,
    ),
  };
}

