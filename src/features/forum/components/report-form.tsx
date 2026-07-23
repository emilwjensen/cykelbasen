import { reportForumContentAction } from "../report-actions";
import { reportReasons } from "../types";

type ReportFormProps = {
  postId: string;
  targetId: string;
  targetType: "post" | "comment";
};

export function ReportForm({
  postId,
  targetId,
  targetType,
}: ReportFormProps) {
  return (
    <details className="report-box">
      <summary>Rapportér</summary>
      <form
        action={reportForumContentAction.bind(
          null,
          postId,
          targetType,
          targetId,
        )}
      >
        <label>
          <span>Årsag</span>
          <select name="reason" required>
            <option value="">Vælg årsag</option>
            {reportReasons.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Ekstra kontekst, valgfrit</span>
          <textarea maxLength={1_000} name="details" rows={3} />
        </label>
        <button className="button button--quiet" type="submit">
          Send rapport
        </button>
      </form>
    </details>
  );
}
