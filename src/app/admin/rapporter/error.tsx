"use client";

export default function ReportsError({ reset }: { reset: () => void }) {
  return (
    <div className="account-page shell">
      <div className="empty-state">
        <p className="eyebrow">Moderator-køen svarede ikke</p>
        <h1>Rapporterne kunne ikke hentes.</h1>
        <button className="button button--dark" onClick={reset} type="button">
          Prøv igen
        </button>
      </div>
    </div>
  );
}
