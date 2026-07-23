import { sendContactRequestAction } from "../actions";
import { contactIntents } from "../types";

export function ContactRequestForm({
  buyerEmail,
  listingId,
  returnUrl,
}: {
  buyerEmail: string;
  listingId: string;
  returnUrl: string;
}) {
  return (
    <details className="contact-request-box">
      <summary className="button button--accent button--full">
        Kontakt sælger
      </summary>
      <form action={sendContactRequestAction.bind(null, listingId)}>
        <input name="returnUrl" type="hidden" value={returnUrl} />
        <label>
          Hvad drejer det sig om?
          <select name="intent" required>
            {contactIntents.map((intent) => (
              <option key={intent.value} value={intent.value}>
                {intent.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Besked
          <textarea
            maxLength={2_000}
            minLength={20}
            name="message"
            placeholder="Skriv dit spørgsmål, forslag til fremvisning eller bud."
            required
            rows={5}
          />
        </label>
        <p>
          Når du sender, deles <strong>{buyerEmail}</strong> med sælgeren, så
          vedkommende kan svare uden intern chat.
        </p>
        <button className="button button--dark button--full" type="submit">
          Send henvendelse
        </button>
      </form>
    </details>
  );
}
