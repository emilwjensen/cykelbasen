import Link from "next/link";
import { EmptyState } from "@/components/empty-state";

export default function NotFound() {
  return (
    <div className="shell error-state">
      <EmptyState
        action={
          <div className="empty-state__actions">
            <Link className="button button--dark" href="/cykler">
              Find en cykel
            </Link>
            <Link className="button button--quiet" href="/">
              Gå til forsiden
            </Link>
          </div>
        }
        eyebrow="Siden findes ikke"
        icon="404"
        title="Du er kørt forkert."
        titleAs="h1"
      >
        <p>
          Linket kan være forældet, eller indholdet kan være flyttet.
        </p>
      </EmptyState>
    </div>
  );
}
