import "server-only";

import { getDatabase } from "@/lib/database";
import type {
  ListingDetail,
  ListingComponentChange,
  ListingComparison,
  ListingFilterOptions,
  ListingFilters,
  ListingImage,
  ListingOwnershipPeriod,
  ListingPageResult,
  ListingSummary,
} from "./types";

const sortClauses: Record<ListingFilters["sort"], string> = {
  newest:
    "(listing.status = 'reserved') asc, listing.published_at desc, listing.id",
  "price-asc":
    "(listing.status = 'reserved') asc, listing.price_dkk asc, listing.published_at desc, listing.id",
  "price-desc":
    "(listing.status = 'reserved') asc, listing.price_dkk desc, listing.published_at desc, listing.id",
  "year-desc":
    "(listing.status = 'reserved') asc, listing.model_year desc nulls last, listing.published_at desc, listing.id",
};

export async function getListings(
  filters: ListingFilters,
  pageSize = 12,
): Promise<ListingPageResult> {
  const clauses = ["listing.status in ('published', 'reserved')"];
  const values: Array<string | number> = [];

  const addValue = (value: string | number) => {
    values.push(value);
    return `$${values.length}`;
  };

  if (filters.q) {
    const parameter = addValue(filters.q);
    clauses.push(
      `listing.search_vector @@ websearch_to_tsquery('simple', ${parameter})`,
    );
  }

  if (filters.category) {
    clauses.push(`listing.category = ${addValue(filters.category)}::bike_category`);
  }

  if (filters.brand) {
    clauses.push(`listing.brand = ${addValue(filters.brand)}`);
  }

  if (filters.size) {
    const size = Number(filters.size.replace(",", "."));
    if (Number.isFinite(size)) {
      const parameter = addValue(size);
      clauses.push(
        `(listing.frame_size_cm = ${parameter} or listing.frame_size_label ilike '%' || ${parameter}::text || '%')`,
      );
    } else {
      const parameter = addValue(filters.size);
      clauses.push(`listing.frame_size_label ilike '%' || ${parameter} || '%'`);
    }
  }

  if (filters.minPrice !== undefined) {
    clauses.push(`listing.price_dkk >= ${addValue(filters.minPrice)}`);
  }

  if (filters.maxPrice !== undefined) {
    clauses.push(`listing.price_dkk <= ${addValue(filters.maxPrice)}`);
  }

  if (filters.material) {
    clauses.push(`listing.material = ${addValue(filters.material)}::frame_material`);
  }

  if (filters.brakes) {
    clauses.push(`listing.brakes = ${addValue(filters.brakes)}::brake_type`);
  }

  if (filters.condition) {
    clauses.push(
      `listing.condition = ${addValue(filters.condition)}::listing_condition`,
    );
  }

  if (filters.city) {
    clauses.push(`listing.city ilike '%' || ${addValue(filters.city)} || '%'`);
  }

  const listValues = [
    ...values,
    pageSize,
    (filters.page - 1) * pageSize,
  ];
  const limitParameter = `$${values.length + 1}`;
  const offsetParameter = `$${values.length + 2}`;
  const listQuery = `
    select
      listing.id,
      listing.status,
      listing.title,
      listing.category,
      listing.brand,
      listing.model,
      listing.model_year,
      listing.frame_size_label,
      listing.material,
      listing.price_dkk,
      listing.condition,
      listing.city,
      listing.published_at,
      cover.image_url as cover_url,
      cover.alt_text as cover_alt
    from public.listings listing
    left join lateral (
      select image.image_url, image.alt_text
      from public.listing_images image
      where image.listing_id = listing.id
      order by image.position
      limit 1
    ) cover on true
    where ${clauses.join(" and ")}
    order by ${sortClauses[filters.sort]}
    limit ${limitParameter}
    offset ${offsetParameter}
  `;
  const countQuery = `
    select count(*)::integer as total
    from public.listings listing
    where ${clauses.join(" and ")}
  `;

  const database = getDatabase();
  const [rows, countRows] = await Promise.all([
    database.query(listQuery, listValues),
    database.query(countQuery, values),
  ]);
  const total = Number((countRows as Array<{ total: number }>)[0]?.total ?? 0);

  return {
    items: rows as unknown as ListingSummary[],
    total,
    page: filters.page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getFeaturedListings(limit = 3) {
  const result = await getListings({ sort: "newest", page: 1 }, limit);
  return result.items;
}

export async function getListingsForComparison(
  ids: string[],
): Promise<ListingComparison[]> {
  if (!ids.length) return [];

  const rows = (await getDatabase().query(
    `
      select
        listing.id,
        listing.status,
        listing.title,
        listing.category,
        listing.brand,
        listing.model,
        listing.model_year,
        listing.frame_size_label,
        listing.frame_size_cm::float8 as frame_size_cm,
        listing.material,
        listing.groupset_brand,
        listing.groupset_model,
        listing.drivetrain,
        listing.brakes,
        listing.wheel_size,
        listing.electronic_shifting,
        listing.shipping_offered,
        listing.purchase_date,
        listing.owner_count,
        listing.purchase_proof_available,
        listing.service_history_available,
        listing.price_dkk,
        listing.condition,
        listing.city,
        cover.image_url as cover_url,
        cover.alt_text as cover_alt
      from public.listings listing
      left join lateral (
        select image.image_url, image.alt_text
        from public.listing_images image
        where image.listing_id = listing.id
        order by image.position
        limit 1
      ) cover on true
      where listing.id = any($1::uuid[])
        and listing.status in ('published', 'reserved')
    `,
    [ids],
  )) as unknown as ListingComparison[];
  const byId = new Map(rows.map((listing) => [listing.id, listing]));

  return ids.flatMap((id) => {
    const listing = byId.get(id);
    return listing ? [listing] : [];
  });
}

export async function getListingFilterOptions(): Promise<ListingFilterOptions> {
  const rows = await getDatabase().query(`
    select
      coalesce(
        (
          select json_agg(value order by value)
          from (
            select distinct brand as value
            from public.listings
            where status in ('published', 'reserved')
          ) brands
        ),
        '[]'::json
      ) as brands,
      coalesce(
        (
          select json_agg(value order by numeric_size nulls last, value)
          from (
            select
              frame_size_label as value,
              min(frame_size_cm) as numeric_size
            from public.listings
            where status in ('published', 'reserved')
            group by frame_size_label
          ) sizes
        ),
        '[]'::json
      ) as sizes,
      coalesce(min(price_dkk), 0)::int as "minPrice",
      coalesce(max(price_dkk), 100000)::int as "maxPrice"
    from public.listings
    where status in ('published', 'reserved')
  `);

  const options = rows as unknown as ListingFilterOptions[];
  return (
    options[0] ?? {
      brands: [],
      sizes: [],
      minPrice: 0,
      maxPrice: 100_000,
    }
  );
}

export async function getListingById(
  id: string,
): Promise<ListingDetail | null> {
  const listingRows = (await getDatabase().query(
    `
      select
        listing.id,
        listing.status,
        listing.seller_id,
        listing.title,
        listing.category,
        listing.brand,
        listing.model,
        listing.model_year,
        listing.frame_size_label,
        listing.frame_size_cm::float8 as frame_size_cm,
        listing.material,
        listing.groupset_brand,
        listing.groupset_model,
        listing.drivetrain,
        listing.brakes,
        listing.wheel_size,
        listing.electronic_shifting,
        listing.shipping_offered,
        listing.purchase_date,
        listing.owner_count,
        listing.purchase_proof_available,
        listing.service_history_available,
        listing.price_dkk,
        listing.condition,
        listing.city,
        listing.description,
        listing.published_at,
        profile.display_name as seller_name,
        profile.city as seller_city,
        true as ownership_verified,
        cover.image_url as cover_url,
        cover.alt_text as cover_alt
      from public.listings listing
      join public.profiles profile on profile.id = listing.seller_id
      left join lateral (
        select image.image_url, image.alt_text
        from public.listing_images image
        where image.listing_id = listing.id
        order by image.position
        limit 1
      ) cover on true
      where listing.id = $1::uuid
        and listing.status in ('published', 'reserved')
      limit 1
    `,
    [id],
  )) as unknown as Array<
    Omit<ListingDetail, "images" | "component_changes" | "ownership_history">
  >;

  const listing = listingRows[0];
  if (!listing) return null;

  const imageRows = await getDatabase().query(
    `
      select id, image_url, alt_text, width, height
      from public.listing_images
      where listing_id = $1::uuid
      order by position
    `,
    [id],
  );

  const componentRows = await getDatabase().query(
    `
      select
        id,
        category,
        previous_component,
        replacement_brand,
        replacement_model,
        changed_on,
        notes,
        documentation_available
      from public.listing_component_changes
      where listing_id = $1::uuid
      order by changed_on desc nulls last, created_at desc
    `,
    [id],
  );

  const ownershipRows = await getDatabase().query(
    `
      select
        owner_sequence,
        started_on,
        ended_on,
        is_current_listing_owner
      from public.get_public_listing_ownership_history($1::uuid)
    `,
    [id],
  );

  return {
    ...listing,
    images: imageRows as unknown as ListingImage[],
    component_changes: componentRows as unknown as ListingComponentChange[],
    ownership_history: ownershipRows as unknown as ListingOwnershipPeriod[],
  };
}
