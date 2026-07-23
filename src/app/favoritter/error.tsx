"use client";

export default function FavoritesError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <div className="browse shell">
      <div className="empty-state">
        <p className="eyebrow">Noget gik galt</p>
        <h1>Favoritterne kunne ikke hentes.</h1>
        <button className="button button--dark" onClick={reset} type="button">
          Prøv igen
        </button>
      </div>
    </div>
  );
}
