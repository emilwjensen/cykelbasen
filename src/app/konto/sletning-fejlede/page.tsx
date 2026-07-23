export default function AccountDeletionFailedPage() {
  return (
    <div className="account-page shell">
      <header className="account-heading">
        <p className="eyebrow">Manuel opfølgning nødvendig</p>
        <h1>Auth-kontoen er lukket, men oprydningen fejlede.</h1>
        <p>
          Sletteanmodningen er registreret i databasen, så en operatør kan
          færdiggøre anonymisering og filoprydning. Kontakt support og oplys
          tidspunktet for forsøget.
        </p>
      </header>
    </div>
  );
}
