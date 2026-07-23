"use client";

export default function ForumError({ reset }: { reset: () => void }) {
  return (
    <div className="account-page shell">
      <div className="empty-state">
        <p className="eyebrow">Forbindelsen drillede</p>
        <h1>Forum kunne ikke hentes.</h1>
        <p>Prøv igen om et øjeblik.</p>
        <button className="button button--dark" onClick={reset} type="button">
          Prøv igen
        </button>
      </div>
    </div>
  );
}
