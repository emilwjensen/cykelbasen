import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthPromo } from "@/components/auth-promo";
import { signInAction } from "@/features/auth/actions";
import { getCurrentUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  "ugyldige-felter": "Kontrollér e-mail og adgangskode.",
  "login-fejlede": "E-mail eller adgangskode blev ikke genkendt.",
};

type SignInPageProps = {
  searchParams: Promise<{
    fejl?: string;
    returnTo?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  if (await getCurrentUser()) redirect("/mine-annoncer");

  const params = await searchParams;
  const message = params.fejl ? errorMessages[params.fejl] : undefined;

  return (
    <div className="auth-shell shell">
      <div className="auth-layout">
        <AuthPromo />
        <section className="auth-card">
          <p className="eyebrow">Velkommen tilbage</p>
          <h1>Log ind på Cykelbasen</h1>
          <p className="auth-card__intro">
            Fortsæt til dine annoncer, cykler og favoritter.
          </p>
          {message && <p className="form-message form-message--error">{message}</p>}
          <form action={signInAction} className="stacked-form">
            <input
              name="returnTo"
              type="hidden"
              value={params.returnTo ?? ""}
            />
            <label>
              E-mail
              <input
                autoComplete="email"
                name="email"
                required
                type="email"
              />
            </label>
            <label>
              Adgangskode
              <input
                autoComplete="current-password"
                minLength={8}
                name="password"
                required
                type="password"
              />
            </label>
            <button className="button button--accent button--full" type="submit">
              Log ind
            </button>
          </form>
          <p className="auth-card__switch">
            Ny på Cykelbasen? <Link href="/auth/opret">Opret en konto</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
