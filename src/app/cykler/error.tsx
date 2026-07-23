"use client";

export default function BrowseError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="shell error-state">
      <p className="eyebrow">Forbindelsen drillede</p>
      <h1>Vi kunne ikke hente cyklerne.</h1>
      <p>Prøv igen om et øjeblik. Dine filtre bliver stående.</p>
      <button className="button button--dark" onClick={reset} type="button">
        Prøv igen
      </button>
    </div>
  );
}

