"use client";

import { AccountNavigation } from "@/components/account-navigation";
import { EmptyState } from "@/components/empty-state";

export default function ProfileError({ reset }: { reset: () => void }) {
  return (
    <div className="account-page shell">
      <AccountNavigation />
      <EmptyState
        action={
          <button className="button button--dark" onClick={reset} type="button">
            Prøv igen
          </button>
        }
        eyebrow="Forbindelsen drillede"
        icon="!"
        title="Profilen kunne ikke hentes."
        titleAs="h1"
      >
        <p>Ingen profiloplysninger er blevet ændret.</p>
      </EmptyState>
    </div>
  );
}
