import Link from "next/link";
import { redirect } from "next/navigation";
import { signUpAction } from "@/features/auth/actions";
import { getCurrentUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  "ugyldige-felter":
    "Udfyld navn og e-mail, og brug mindst 8 tegn i adgangskoden.",
  "oprettelse-fejlede":
    "Kontoen kunne ikke oprettes. E-mailen kan allerede være i brug.",
};

type SignUpPageProps = {
  searchParams: Promise<{ fejl?: string }>;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  if (await getCurrentUser()) redirect("/profil");

  const params = await searchParams;
  const message = params.fejl ? errorMessages[params.fejl] : undefined;

  return (
    <div className="auth-shell shell">
      <section className="auth-card">
        <p className="eyebrow">Bliv en del af markedet</p>
        <h1>Opret din konto</h1>
        <p className="auth-card__intro">
          En konto er nødvendig for at oprette annoncer og dokumentere ejerskab.
        </p>
        {message && <p className="form-message form-message--error">{message}</p>}
        <form action={signUpAction} className="stacked-form">
          <label>
            Navn
            <input
              autoComplete="name"
              maxLength={60}
              minLength={2}
              name="name"
              required
            />
          </label>
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
              autoComplete="new-password"
              minLength={8}
              name="password"
              required
              type="password"
            />
          </label>
          <button className="button button--accent button--full" type="submit">
            Opret konto
          </button>
        </form>
        <p className="auth-card__switch">
          Har du allerede en konto? <Link href="/auth/log-ind">Log ind</Link>
        </p>
      </section>
    </div>
  );
}

