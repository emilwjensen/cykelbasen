export function AuthPromo() {
  return (
    <aside className="auth-promo">
      <div>
        <p className="eyebrow">Mere end en annoncekonto</p>
        <h2>Én konto til hele cyklens næste kapitel.</h2>
        <p>
          Gem favoritter, registrér dine egne cykler og sælg med dokumenteret
          ejerskab.
        </p>
      </div>
      <ul>
        <li>
          <span aria-hidden="true">✓</span>
          <div>
            <strong>Private dokumenter</strong>
            <p>Ejerskabsbilag og stelnummer bliver aldrig offentlige.</p>
          </div>
        </li>
        <li>
          <span aria-hidden="true">✓</span>
          <div>
            <strong>Samlet cykelhistorik</strong>
            <p>Service, komponenter og ejerperioder følger cyklen sikkert.</p>
          </div>
        </li>
        <li>
          <span aria-hidden="true">✓</span>
          <div>
            <strong>Ingen betalingsoplysninger</strong>
            <p>Cykelbasen håndterer ikke betaling eller kortdata.</p>
          </div>
        </li>
      </ul>
    </aside>
  );
}
