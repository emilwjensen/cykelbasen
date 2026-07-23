import Link from "next/link";
import type { ListingFilters } from "../types";

type ListingPaginationProps = {
  filters: ListingFilters;
  totalPages: number;
};

function pageUrl(filters: ListingFilters, page: number) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (
      key === "page" ||
      value === undefined ||
      value === "" ||
      (key === "sort" && value === "newest")
    ) {
      continue;
    }
    params.set(key, String(value));
  }

  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/cykler?${query}` : "/cykler";
}

function visiblePages(currentPage: number, totalPages: number) {
  const pages = new Set([1, totalPages]);
  for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
    if (page >= 1 && page <= totalPages) pages.add(page);
  }
  return [...pages].sort((left, right) => left - right);
}

export function ListingPagination({
  filters,
  totalPages,
}: ListingPaginationProps) {
  if (totalPages <= 1) return null;

  const pages = visiblePages(filters.page, totalPages);

  return (
    <nav aria-label="Sider med cykler" className="listing-pagination">
      {filters.page > 1 ? (
        <Link href={pageUrl(filters, filters.page - 1)} rel="prev">
          <span aria-hidden="true">←</span> Forrige
        </Link>
      ) : (
        <span aria-disabled="true">
          <span aria-hidden="true">←</span> Forrige
        </span>
      )}

      <div>
        {pages.map((page, index) => (
          <span key={page}>
            {index > 0 && pages[index - 1] !== page - 1 && (
              <i aria-hidden="true">…</i>
            )}
            <Link
              aria-current={page === filters.page ? "page" : undefined}
              href={pageUrl(filters, page)}
            >
              {page}
            </Link>
          </span>
        ))}
      </div>

      {filters.page < totalPages ? (
        <Link href={pageUrl(filters, filters.page + 1)} rel="next">
          Næste <span aria-hidden="true">→</span>
        </Link>
      ) : (
        <span aria-disabled="true">
          Næste <span aria-hidden="true">→</span>
        </span>
      )}
    </nav>
  );
}
