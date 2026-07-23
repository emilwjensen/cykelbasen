import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privatliv",
  description: "Sådan behandler Cykelbasen profil-, annonce- og cykeldata.",
};

const supportEmail =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "kontakt@cykelbasen.dk";

export default function PrivacyPage() {
  return (
    <article className="legal-page shell">
      <p className="eyebrow">Privatliv</p>
      <h1>Dine data skal være forståelige og afgrænsede.</h1>
      <p className="legal-page__lead">
        Denne side beskriver den tekniske behandling i Cykelbasens beta. Den
        endelige politik skal godkendes sammen med virksomhedens identitet,
        databehandleraftaler og konkrete opbevaringsperioder før offentlig
        lancering.
      </p>

      <section>
        <h2>Data vi behandler</h2>
        <p>
          Konto og profil omfatter e-mail, visningsnavn og valgfri by. Annoncer
          indeholder strukturerede cykeloplysninger, billeder, henvendelser og
          statusaudit. “Mine cykler” indeholder private logs, kilometerstand,
          vedligeholdelse og ejerperioder.
        </p>
      </section>
      <section>
        <h2>Følsom dokumentation</h2>
        <p>
          Ejerskabsbeviser opbevares i et separat privat filarkiv. De kan kun
          åbnes af ejeren og autoriserede moderatorer. Et stelnummer gemmes kun
          som en envejs-hash; rå dokumentstier, dokumenter og moderatornoter
          offentliggøres ikke.
        </p>
      </section>
      <section>
        <h2>Offentligt indhold</h2>
        <p>
          Publicerede annoncer, annoncebilleder, visningsnavn, forumindlæg og
          kommentarer er offentlige. Private cykellogs og tidligere ejeres
          identiteter vises ikke i den offentlige ejerskabstidslinje.
        </p>
      </section>
      <section>
        <h2>Leverandører og sikkerhed</h2>
        <p>
          Neon anvendes til autentifikation og Postgres. Vercel anvendes til
          applikationsdrift og separate offentlige/private Blob-arkiver.
          Adgangskontrol håndhæves både i serverlaget og med Row Level Security i
          databasen.
        </p>
      </section>
      <section>
        <h2>Indsigt, rettelse og sletning</h2>
        <p>
          Under betaen kan du anmode om indsigt, eksport, rettelse eller
          sletning via{" "}
          <a href={`mailto:${supportEmail}`}>{supportEmail}</a>. Audit- og
          ejerskabsposter kan blive anonymiseret frem for slettet, når de er
          nødvendige for sikkerhed eller en sammenhængende ejerhistorik.
        </p>
      </section>
    </article>
  );
}

