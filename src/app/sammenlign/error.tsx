"use client";

export default function ComparisonError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <div className="error-state shell">
      <p className="eyebrow">Sammenligningen kunne ikke hentes</p>
      <h1>Prøv igen om et øjeblik.</h1>
      <p>Dine valgte cykler ligger stadig i browseren.</p>
      <button className="button button--dark" onClick={reset} type="button">
        Prøv igen
      </button>
    </div>
  );
}
