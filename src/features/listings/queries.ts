import "server-only";

import { getDatabase } from "@/lib/database";
import type {
  ListingDetail,
  ListingFilters,
  ListingImage,
  ListingSummary,
} from "./types";

const sortClauses: Record<ListingFilters["sort"], string> = {
  newest: "listing.published_at desc",
  "price-asc": "listing.price_dkk asc, listing.published_at desc",
  "price-desc": "listing.price_dkk desc, listing.published_at desc",
  "year-desc":
    "listing.model_year desc nulls last, listing.published_at desc",
};

export async function getListings(
  filters: ListingFilters,
  limit = 48,
): Promise<ListingSummary[]> {
  const clauses = ["listing.status = 'published'"];
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

  const limitParameter = addValue(limit);
  const query = `
    select
      listing.id,
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
      cover.alt_text as cover_alt,
      count(*) over()::integer as total_count
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
  `;

  const rows = await getDatabase().query(query, values);
  return rows as unknown as ListingSummary[];
}

export async function getFeaturedListings(limit = 3) {
  return getListings({ sort: "newest" }, limit);
}

export async function getListingById(
  id: string,
): Promise<ListingDetail | null> {
  const listingRows = (await getDatabase().query(
    `
      select
        listing.id,
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
        listing.price_dkk,
        listing.condition,
        listing.city,
        listing.description,
        listing.published_at,
        profile.display_name as seller_name,
        profile.city as seller_city,
        cover.image_url as cover_url,
        cover.alt_text as cover_alt,
        1::integer as total_count
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
        and listing.status = 'published'
      limit 1
    `,
    [id],
  )) as unknown as Array<Omit<ListingDetail, "images">>;

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

  return {
    ...listing,
    images: imageRows as unknown as ListingImage[],
  };
}
