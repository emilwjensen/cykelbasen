"use client";

export default function ListingReportsError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <div className="moderation-page shell">
      <div className="empty-state">
        <p className="eyebrow">Noget gik galt</p>
        <h1>Annoncerapporterne kunne ikke hentes.</h1>
        <button className="button button--dark" onClick={reset} type="button">
          Prøv igen
        </button>
      </div>
    </div>
  );
}
