import Link from "next/link";

export default function ListingNotFound() {
  return (
    <div className="shell error-state">
      <p className="eyebrow">Annoncen er væk</p>
      <h1>Vi kunne ikke finde den cykel.</h1>
      <p>Den kan være solgt, arkiveret eller have fået et nyt link.</p>
      <Link className="button button--dark" href="/cykler">
        Se aktuelle cykler
      </Link>
    </div>
  );
}

