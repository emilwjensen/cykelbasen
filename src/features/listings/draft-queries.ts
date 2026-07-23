import "server-only";

import { getApplicationDatabase } from "@/lib/database";
import type { DraftListingInput } from "./draft-schema";
import type { EditableListing, SellerListing } from "./draft-types";

export async function getSellerListings(
  userId: string,
): Promise<SellerListing[]> {
  const database = getApplicationDatabase();
  const results = await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${userId}, true)`,
    transaction`
      select
        listing.id,
        listing.title,
        listing.brand,
        listing.model,
        listing.price_dkk,
        listing.status,
        listing.updated_at,
        cover.image_url as cover_url
      from public.listings listing
      left join lateral (
        select image.image_url
        from public.listing_images image
        where image.listing_id = listing.id
        order by image.position
        limit 1
      ) cover on true
      where listing.seller_id = ${userId}
      order by listing.updated_at desc
    `,
  ]);

  return results[1] as unknown as SellerListing[];
}

export async function getEditableListing(
  userId: string,
  listingId: string,
): Promise<EditableListing | null> {
  const database = getApplicationDatabase();
  const results = await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${userId}, true)`,
    transaction`
      select
        id,
        status,
        title,
        category,
        brand,
        model,
        model_year as "modelYear",
        frame_size_label as "frameSizeLabel",
        frame_size_cm::float8 as "frameSizeCm",
        material,
        groupset_brand as "groupsetBrand",
        groupset_model as "groupsetModel",
        drivetrain,
        brakes,
        wheel_size as "wheelSize",
        electronic_shifting as "electronicShifting",
        shipping_offered as "shippingOffered",
        price_dkk as "priceDkk",
        condition,
        city,
        description
      from public.listings
      where id = ${listingId}::uuid
        and seller_id = ${userId}
        and status in ('draft', 'rejected')
      limit 1
    `,
  ]);

  const rows = results[1] as unknown as EditableListing[];
  return rows[0] ?? null;
}

export async function createDraftListing(
  userId: string,
  input: DraftListingInput,
) {
  const database = getApplicationDatabase();
  const results = await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${userId}, true)`,
    transaction`
      insert into public.listings (
        seller_id,
        title,
        category,
        brand,
        model,
        model_year,
        frame_size_label,
        frame_size_cm,
        material,
        groupset_brand,
        groupset_model,
        drivetrain,
        brakes,
        wheel_size,
        electronic_shifting,
        shipping_offered,
        price_dkk,
        condition,
        city,
        description
      )
      values (
        ${userId},
        ${input.title},
        ${input.category}::public.bike_category,
        ${input.brand},
        ${input.model},
        ${input.modelYear ?? null},
        ${input.frameSizeLabel},
        ${input.frameSizeCm ?? null},
        ${input.material ?? null}::public.frame_material,
        ${input.groupsetBrand ?? null},
        ${input.groupsetModel ?? null},
        ${input.drivetrain ?? null},
        ${input.brakes ?? null}::public.brake_type,
        ${input.wheelSize ?? null},
        ${input.electronicShifting},
        ${input.shippingOffered},
        ${input.priceDkk},
        ${input.condition}::public.listing_condition,
        ${input.city},
        ${input.description}
      )
      returning id
    `,
  ]);

  const rows = results[1] as unknown as Array<{ id: string }>;
  return rows[0]?.id;
}

export async function updateDraftListing(
  userId: string,
  listingId: string,
  input: DraftListingInput,
) {
  const database = getApplicationDatabase();
  const results = await database.transaction((transaction) => [
    transaction`select set_config('app.user_id', ${userId}, true)`,
    transaction`
      update public.listings
      set
        title = ${input.title},
        category = ${input.category}::public.bike_category,
        brand = ${input.brand},
        model = ${input.model},
        model_year = ${input.modelYear ?? null},
        frame_size_label = ${input.frameSizeLabel},
        frame_size_cm = ${input.frameSizeCm ?? null},
        material = ${input.material ?? null}::public.frame_material,
        groupset_brand = ${input.groupsetBrand ?? null},
        groupset_model = ${input.groupsetModel ?? null},
        drivetrain = ${input.drivetrain ?? null},
        brakes = ${input.brakes ?? null}::public.brake_type,
        wheel_size = ${input.wheelSize ?? null},
        electronic_shifting = ${input.electronicShifting},
        shipping_offered = ${input.shippingOffered},
        price_dkk = ${input.priceDkk},
        condition = ${input.condition}::public.listing_condition,
        city = ${input.city},
        description = ${input.description},
        status = 'draft'
      where id = ${listingId}::uuid
        and seller_id = ${userId}
        and status in ('draft', 'rejected')
      returning id
    `,
  ]);

  const rows = results[1] as unknown as Array<{ id: string }>;
  return Boolean(rows[0]);
}

