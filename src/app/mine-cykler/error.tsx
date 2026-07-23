"use client";

import { AccountNavigation } from "@/components/account-navigation";
import { EmptyState } from "@/components/empty-state";

export default function MyBikesError({ reset }: { reset: () => void }) {
  return (
    <div className="garage-page shell">
      <AccountNavigation />
      <EmptyState
        action={
          <button className="button button--dark" onClick={reset} type="button">
            Prøv igen
          </button>
        }
        eyebrow="Forbindelsen drillede"
        icon="!"
        title="Dine cykler kunne ikke hentes."
        titleAs="h1"
      >
        <p>Din private cykelhistorik er ikke ændret. Prøv igen om et øjeblik.</p>
      </EmptyState>
    </div>
  );
}
