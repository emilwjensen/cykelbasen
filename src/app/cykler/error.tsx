"use client";

import { EmptyState } from "@/components/empty-state";

export default function BrowseError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="shell browse browse--error">
      <EmptyState
        action={
          <button className="button button--dark" onClick={reset} type="button">
            Prøv igen
          </button>
        }
        eyebrow="Forbindelsen drillede"
        icon="!"
        title="Vi kunne ikke hente cyklerne."
        titleAs="h1"
      >
        <p>Prøv igen om et øjeblik. Dine filtre bliver stående.</p>
      </EmptyState>
    </div>
  );
}
