"use client";

export default function ContactRequestsError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <div className="account-page shell">
      <div className="empty-state">
        <p className="eyebrow">Noget gik galt</p>
        <h1>Henvendelserne kunne ikke hentes.</h1>
        <button className="button button--dark" onClick={reset} type="button">
          Prøv igen
        </button>
      </div>
    </div>
  );
}
