import Link from "next/link";
import { saveProfileAction } from "@/features/profiles/actions";
import { getProfile } from "@/features/profiles/queries";
import { requireUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

type ProfilePageProps = {
  searchParams: Promise<{
    ny?: string;
    gemt?: string;
    fejl?: string;
  }>;
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const [user, params] = await Promise.all([requireUser(), searchParams]);
  const profile = await getProfile(user.id);

  return (
    <div className="account-page shell">
      <header className="account-heading">
        <p className="eyebrow">Din konto</p>
        <h1>Profil</h1>
        <p>
          Dit visningsnavn og din by bliver vist på dine publicerede annoncer.
          Din e-mail forbliver privat.
        </p>
      </header>

      <div className="account-grid">
        <form action={saveProfileAction} className="account-card stacked-form">
          {params.ny && (
            <p className="form-message">
              Kontoen er oprettet. Færdiggør din profil for at sælge.
            </p>
          )}
          {params.gemt && (
            <p className="form-message form-message--success">
              Profilen er gemt.
            </p>
          )}
          {params.fejl && (
            <p className="form-message form-message--error">
              Kontrollér navn og by.
            </p>
          )}
          <label>
            Visningsnavn
            <input
              defaultValue={profile?.display_name ?? user.name ?? ""}
              maxLength={60}
              minLength={2}
              name="displayName"
              required
            />
            <small>Brug gerne fornavn og efternavnets første bogstav.</small>
          </label>
          <label>
            By
            <input
              defaultValue={profile?.city ?? ""}
              maxLength={80}
              minLength={2}
              name="city"
              placeholder="Fx Aarhus"
              required
            />
          </label>
          <label>
            E-mail
            <input disabled value={user.email} />
            <small>E-mailen styres af din sikre Neon Auth-konto.</small>
          </label>
          <button className="button button--accent" type="submit">
            Gem profil
          </button>
        </form>

        <aside className="account-aside">
          <p className="account-aside__label">Næste skridt</p>
          <h2>Har du en cykel, der skal videre?</h2>
          <p>
            Når profilen er gemt, kan du oprette en struktureret kladde. Den
            bliver ikke offentlig, før ejerskab er dokumenteret og godkendt.
          </p>
          <Link className="button button--dark" href="/annoncer/ny">
            Opret annonce
          </Link>
          <Link className="text-link account-aside__link" href="/mine-cykler">
            Eller registrér din egen cykel <span aria-hidden="true">→</span>
          </Link>
        </aside>
      </div>
    </div>
  );
}
