import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vilkår",
  description: "Grundregler for brug af Cykelbasens markedsplads og forum.",
};

const supportEmail =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "kontakt@cykelbasen.dk";

export default function TermsPage() {
  return (
    <article className="legal-page shell">
      <p className="eyebrow">Vilkår for beta</p>
      <h1>Klare regler for en troværdig cykelhandel.</h1>
      <p className="legal-page__lead">
        Cykelbasen formidler kontakt mellem private brugere og er ikke part i
        handlen. Disse betavilkår er et produktudkast og skal juridisk
        kvalitetssikres før offentlig lancering.
      </p>

      <section>
        <h2>Din konto</h2>
        <p>
          Du skal bruge korrekte kontaktoplysninger, beskytte din konto og må
          ikke udgive dig for at være en anden. Misbrug, automatiseret spam og
          omgåelse af adgangsbegrænsninger kan medføre lukning.
        </p>
      </section>
      <section>
        <h2>Annoncer og ejerskab</h2>
        <p>
          Du må kun annoncere en cykel, du lovligt kan sælge. Oplysninger om
          stand, komponenter, historik og dokumentation skal være retvisende.
          Godkendt dokumentation er en manuel kontrol, ikke en garanti for
          cyklens stand, identitet eller den efterfølgende handel.
        </p>
      </section>
      <section>
        <h2>Køb og reservation</h2>
        <p>
          Pris, betaling, besigtigelse, levering og slutseddel aftales direkte
          mellem køber og sælger. En reservation viser kun den aftalte status på
          platformen; Cykelbasen holder ikke penge og tilbyder ikke escrow eller
          køberbeskyttelse.
        </p>
      </section>
      <section>
        <h2>Forum og moderation</h2>
        <p>
          Hold en saglig tone og del ikke andres private oplysninger.
          Moderatorer kan skjule indhold eller annoncer ved svindelmistanke,
          chikane, ulovligt indhold eller brud på reglerne. Afgørelser registreres
          i platformens private auditspor.
        </p>
      </section>
      <section>
        <h2>Problemer og kontakt</h2>
        <p>
          Rapportér mistænkelige annoncer gennem rapportfunktionen. Andre
          henvendelser kan sendes til{" "}
          <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.
        </p>
      </section>
    </article>
  );
}

