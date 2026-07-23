import Image from "next/image";
import {
  deleteListingImageAction,
  deleteOwnershipDocumentAction,
  moveListingImageAction,
  uploadListingImagesAction,
  uploadOwnershipDocumentAction,
} from "@/features/listings/media-actions";
import type { ListingMedia } from "@/features/listings/media-types";
import {
  MAX_LISTING_IMAGES,
  storageConfiguration,
} from "@/lib/blob-storage";

const messages: Record<string, { kind: "error" | "success"; text: string }> = {
  "kladde-oprettet": {
    kind: "success",
    text: "Kladden er gemt. Tilføj nu billeder og privat dokumentation.",
  },
  "billeder-gemt": {
    kind: "success",
    text: "Billederne er uploadet og gemt.",
  },
  "billede-slettet": { kind: "success", text: "Billedet er slettet." },
  "raekkefoelge-gemt": {
    kind: "success",
    text: "Billedrækkefølgen er opdateret.",
  },
  "dokument-gemt": {
    kind: "success",
    text: "Dokumentationen er uploadet privat.",
  },
  "dokument-slettet": {
    kind: "success",
    text: "Dokumentationen er slettet.",
  },
  "vaelg-billede": { kind: "error", text: "Vælg mindst ét billede." },
  "for-mange-billeder": {
    kind: "error",
    text: `En annonce kan højst have ${MAX_LISTING_IMAGES} billeder.`,
  },
  "ugyldigt-billede": {
    kind: "error",
    text: "Billedet skal være JPEG, PNG eller WebP og højst 5 MB.",
  },
  "ugyldigt-dokument": {
    kind: "error",
    text: "Dokumentet skal være PDF, JPEG, PNG eller WebP og højst 10 MB.",
  },
  "ugyldigt-stelnummer": {
    kind: "error",
    text: "Stelnummeret er for langt eller ugyldigt.",
  },
  "dokument-findes": {
    kind: "error",
    text: "Der findes allerede dokumentation, som afventer kontrol.",
  },
  begraenset: {
    kind: "error",
    text: "Uploadgrænsen er nået. Vent og prøv igen senere.",
  },
  fejl: {
    kind: "error",
    text: "Filen kunne ikke behandles. Kontrollér lageropsætningen og prøv igen.",
  },
};

const documentLabels = {
  approved: "Godkendt",
  pending: "Afventer kontrol",
  rejected: "Afvist",
} as const;

function formatBytes(value: number | null) {
  if (value === null) return null;
  return value >= 1024 * 1024
    ? `${(value / 1024 / 1024).toLocaleString("da-DK", {
        maximumFractionDigits: 1,
      })} MB`
    : `${Math.ceil(value / 1024).toLocaleString("da-DK")} KB`;
}

type ListingMediaManagerProps = {
  listingId: string;
  media: ListingMedia;
  messageCode?: string;
};

export function ListingMediaManager({
  listingId,
  media,
  messageCode,
}: ListingMediaManagerProps) {
  const configuration = storageConfiguration();
  const message = messageCode ? messages[messageCode] : undefined;
  const editable = ["draft", "rejected"].includes(media.listingStatus);
  const activeDocument = media.documents.find(
    (document) => document.status !== "rejected",
  );

  return (
    <section className="listing-media-manager" id="annoncefiler">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Billeder og kontrol</p>
          <h2>Gør annoncen klar til publicering</h2>
        </div>
        <p>
          Billeder bliver offentlige ved publicering. Ejerskabsdokumentation
          forbliver privat.
        </p>
      </div>

      {message && (
        <p
          className={`form-message ${
            message.kind === "error"
              ? "form-message--error"
              : "form-message--success"
          }`}
          role={message.kind === "error" ? "alert" : "status"}
        >
          {message.text}
        </p>
      )}

      <div className="listing-media-manager__grid">
        <div className="listing-media-panel">
          <header>
            <div>
              <span className="listing-media-panel__step">1</span>
              <div>
                <h3>Annoncebilleder</h3>
                <p>
                  {media.images.length} af {MAX_LISTING_IMAGES} billeder
                </p>
              </div>
            </div>
            {media.images.length > 0 && <strong>Første billede er cover</strong>}
          </header>

          {media.images.length ? (
            <ol className="listing-image-editor">
              {media.images.map((image, index) => (
                <li key={image.id}>
                  <div className="listing-image-editor__preview">
                    <Image
                      alt={image.alt_text}
                      fill
                      sizes="140px"
                      src={image.image_url}
                    />
                    {index === 0 && <span>Cover</span>}
                  </div>
                  <div className="listing-image-editor__meta">
                    <strong>{image.original_filename ?? `Billede ${index + 1}`}</strong>
                    <span>{formatBytes(image.size_bytes)}</span>
                  </div>
                  {editable && (
                    <div className="listing-image-editor__actions">
                      <form
                        action={moveListingImageAction.bind(
                          null,
                          listingId,
                          image.id,
                          "up",
                        )}
                      >
                        <button
                          aria-label={`Flyt billede ${index + 1} mod venstre`}
                          className="icon-button"
                          disabled={index === 0}
                          type="submit"
                        >
                          ←
                        </button>
                      </form>
                      <form
                        action={moveListingImageAction.bind(
                          null,
                          listingId,
                          image.id,
                          "down",
                        )}
                      >
                        <button
                          aria-label={`Flyt billede ${index + 1} mod højre`}
                          className="icon-button"
                          disabled={index === media.images.length - 1}
                          type="submit"
                        >
                          →
                        </button>
                      </form>
                      <form
                        action={deleteListingImageAction.bind(
                          null,
                          listingId,
                          image.id,
                        )}
                      >
                        <button className="button-link button-link--danger" type="submit">
                          Slet
                        </button>
                      </form>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <div className="listing-media-empty">
              <strong>Ingen billeder endnu</strong>
              <p>Upload skarpe billeder fra begge sider og af relevante detaljer.</p>
            </div>
          )}

          {editable &&
            (configuration.listingImages ? (
              <form
                action={uploadListingImagesAction.bind(null, listingId)}
                className="listing-upload-form"
              >
                <label>
                  Tilføj billeder
                  <input
                    accept="image/jpeg,image/png,image/webp"
                    disabled={media.images.length >= MAX_LISTING_IMAGES}
                    multiple
                    name="images"
                    required
                    type="file"
                  />
                </label>
                <small>JPEG, PNG eller WebP · højst 5 MB per billede</small>
                <button
                  className="button button--dark"
                  disabled={media.images.length >= MAX_LISTING_IMAGES}
                  type="submit"
                >
                  Upload billeder
                </button>
              </form>
            ) : (
              <p className="storage-warning">
                Billedlageret mangler miljøvariablen{" "}
                <code>LISTING_IMAGES_BLOB_READ_WRITE_TOKEN</code>.
              </p>
            ))}
        </div>

        <div className="listing-media-panel">
          <header>
            <div>
              <span className="listing-media-panel__step">2</span>
              <div>
                <h3>Ejerskabsdokumentation</h3>
                <p>Kun dig og moderatorer</p>
              </div>
            </div>
          </header>

          {activeDocument ? (
            <article className="ownership-upload-card">
              <div>
                <span className={`status status--document-${activeDocument.status}`}>
                  {documentLabels[activeDocument.status]}
                </span>
                <strong>
                  {activeDocument.original_filename ?? "Privat dokument"}
                </strong>
                <small>
                  {[formatBytes(activeDocument.size_bytes), activeDocument.content_type]
                    .filter(Boolean)
                    .join(" · ")}
                </small>
                {activeDocument.frame_number_registered && (
                  <small>Stelnummer registreret som envejs-hash</small>
                )}
              </div>
              <div className="ownership-upload-card__actions">
                <a
                  className="button button--quiet"
                  href={`/api/ownership-documents/${activeDocument.id}/preview`}
                  rel="noreferrer"
                  target="_blank"
                >
                  Åbn privat preview
                </a>
                {editable && activeDocument.status === "pending" && (
                  <form
                    action={deleteOwnershipDocumentAction.bind(
                      null,
                      listingId,
                      activeDocument.id,
                    )}
                  >
                    <button className="button-link button-link--danger" type="submit">
                      Slet og erstat
                    </button>
                  </form>
                )}
              </div>
              {activeDocument.review_note && (
                <p>Moderatorens note: {activeDocument.review_note}</p>
              )}
            </article>
          ) : editable && configuration.ownershipDocuments ? (
            <form
              action={uploadOwnershipDocumentAction.bind(null, listingId)}
              className="listing-upload-form"
            >
              <label>
                Kvittering, slutseddel eller andet ejerskabsbevis
                <input
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  name="document"
                  required
                  type="file"
                />
              </label>
              <label>
                Stelnummer <span>valgfrit</span>
                <input
                  autoComplete="off"
                  maxLength={120}
                  name="frameNumber"
                  placeholder="Gemmes kun som envejs-hash"
                />
              </label>
              <small>PDF, JPEG, PNG eller WebP · højst 10 MB</small>
              <button className="button button--dark" type="submit">
                Upload privat dokument
              </button>
            </form>
          ) : editable ? (
            <p className="storage-warning">
              Dokumentlageret mangler miljøvariablen{" "}
              <code>OWNERSHIP_DOCUMENTS_BLOB_READ_WRITE_TOKEN</code>.
            </p>
          ) : (
            <div className="listing-media-empty">
              <strong>Ingen aktiv dokumentpost</strong>
              <p>Annoncen kan ikke sendes til kontrol uden dokumentation.</p>
            </div>
          )}

          {media.documents.some((document) => document.status === "rejected") && (
            <details className="rejected-document-history">
              <summary>Tidligere afviste dokumenter</summary>
              {media.documents
                .filter((document) => document.status === "rejected")
                .map((document) => (
                  <article key={document.id}>
                    <span>{document.original_filename ?? "Privat dokument"}</span>
                    <p>{document.review_note ?? "Ingen moderatornote."}</p>
                    {editable && (
                      <form
                        action={deleteOwnershipDocumentAction.bind(
                          null,
                          listingId,
                          document.id,
                        )}
                      >
                        <button className="button-link button-link--danger" type="submit">
                          Slet fil
                        </button>
                      </form>
                    )}
                  </article>
                ))}
            </details>
          )}
        </div>
      </div>
    </section>
  );
}
