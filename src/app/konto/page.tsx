import Link from "next/link";
import { AccountNavigation } from "@/components/account-navigation";
import { deleteAccountAction } from "@/features/account/actions";
import { requireUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ fejl?: string }>;
}) {
  const [, query] = await Promise.all([requireUser(), searchParams]);

  return (
    <div className="account-page shell">
      <AccountNavigation />
      <header className="account-heading">
        <p className="eyebrow">Data og privatliv</p>
        <h1>Din konto</h1>
        <p>Hent dine data eller slet kontoen med et dokumenteret oprydningsflow.</p>
      </header>

      <section className="account-card stacked-form">
        <h2>Eksportér dine data</h2>
        <p>
          Eksporten er en JSON-fil med profil, annoncer, cykelpas, logs,
          påmindelser, forumindhold og henvendelser. Hemmelige objektstier og
          stelnummer-hashes udelades.
        </p>
        <a className="button button--accent" href="/api/account/export">
          Hent kontoeksport
        </a>
      </section>

      <section className="account-card stacked-form">
        <h2>Slet konto</h2>
        <p>
          Neon Auth-kontoen slettes, private dokumenter og aktivitetsdata
          fjernes, og nødvendige handels- og ejerskabsspor anonymiseres.
          Handlingen kan ikke fortrydes. Hent gerne en eksport først.
        </p>
        {query.fejl && (
          <p className="form-message form-message--error" role="alert">
            {query.fejl === "adgangskode"
              ? "Adgangskoden blev afvist, eller Neon Auth tillader ikke kontosletning endnu."
              : "Skriv den præcise bekræftelse og din adgangskode."}
          </p>
        )}
        <form action={deleteAccountAction} className="stacked-form">
          <label>
            Skriv SLET MIN KONTO
            <input
              autoComplete="off"
              name="confirmation"
              pattern="SLET MIN KONTO"
              required
            />
          </label>
          <label>
            Bekræft med din adgangskode
            <input
              autoComplete="current-password"
              minLength={8}
              name="password"
              required
              type="password"
            />
          </label>
          <button className="button button--quiet" type="submit">
            Slet konto permanent
          </button>
        </form>
      </section>

      <Link className="back-link" href="/profil">← Tilbage til profil</Link>
    </div>
  );
}
