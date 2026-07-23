import { reportListingAction } from "../actions";
import { listingReportReasons } from "../types";

export function ListingReportForm({
  listingId,
  returnUrl,
}: {
  listingId: string;
  returnUrl: string;
}) {
  return (
    <details className="report-box listing-report-box">
      <summary>Rapportér annonce</summary>
      <form action={reportListingAction.bind(null, listingId)}>
        <input name="returnUrl" type="hidden" value={returnUrl} />
        <label>
          Årsag
          <select name="reason" required>
            {listingReportReasons.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Supplerende oplysninger
          <textarea
            maxLength={1_000}
            minLength={5}
            name="details"
            placeholder="Beskriv konkrete tegn, som moderatorerne bør undersøge."
            rows={4}
          />
        </label>
        <button className="button button--quiet" type="submit">
          Send rapport
        </button>
      </form>
    </details>
  );
}
