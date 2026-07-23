export const bikeCategories = [
  { value: "road", label: "Landevej" },
  { value: "gravel", label: "Gravel" },
  { value: "cyclocross", label: "Cyclocross" },
  { value: "triathlon", label: "Triatlon / TT" },
  { value: "vintage", label: "Vintage" },
  { value: "electric-road", label: "El-racer" },
] as const;

export const frameMaterials = [
  { value: "carbon", label: "Carbon" },
  { value: "aluminium", label: "Aluminium" },
  { value: "steel", label: "Stål" },
  { value: "titanium", label: "Titanium" },
  { value: "other", label: "Andet" },
] as const;

export const brakeTypes = [
  { value: "disc-hydraulic", label: "Hydrauliske skiver" },
  { value: "disc-mechanical", label: "Mekaniske skiver" },
  { value: "rim", label: "Fælgbremser" },
  { value: "other", label: "Andet" },
] as const;

export const conditions = [
  { value: "like-new", label: "Som ny" },
  { value: "excellent", label: "Meget god" },
  { value: "good", label: "God" },
  { value: "used", label: "Brugt" },
] as const;

export const sortOptions = [
  { value: "newest", label: "Nyeste først" },
  { value: "price-asc", label: "Laveste pris" },
  { value: "price-desc", label: "Højeste pris" },
  { value: "year-desc", label: "Nyeste modelår" },
] as const;

export type ListingFilters = {
  q?: string;
  category?: (typeof bikeCategories)[number]["value"];
  brand?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  material?: (typeof frameMaterials)[number]["value"];
  brakes?: (typeof brakeTypes)[number]["value"];
  condition?: (typeof conditions)[number]["value"];
  city?: string;
  sort: (typeof sortOptions)[number]["value"];
  page: number;
};

export type ListingSummary = {
  id: string;
  status: "published" | "reserved";
  title: string;
  category: (typeof bikeCategories)[number]["value"];
  brand: string;
  model: string;
  model_year: number | null;
  frame_size_label: string;
  material: (typeof frameMaterials)[number]["value"] | null;
  price_dkk: number;
  condition: (typeof conditions)[number]["value"];
  city: string;
  published_at: string;
  cover_url: string | null;
  cover_alt: string | null;
};

export type ListingDetail = ListingSummary & {
  seller_id: string;
  frame_size_cm: number | null;
  groupset_brand: string | null;
  groupset_model: string | null;
  drivetrain: string | null;
  brakes: (typeof brakeTypes)[number]["value"] | null;
  wheel_size: string | null;
  electronic_shifting: boolean;
  shipping_offered: boolean;
  purchase_date: string;
  owner_count: number;
  purchase_proof_available: boolean;
  service_history_available: boolean;
  ownership_verified: boolean;
  description: string;
  seller_name: string;
  seller_city: string | null;
  images: ListingImage[];
  component_changes: ListingComponentChange[];
  ownership_history: ListingOwnershipPeriod[];
};

export type ListingPageResult = {
  items: ListingSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type ListingComparison = {
  id: string;
  status: "published" | "reserved";
  title: string;
  category: (typeof bikeCategories)[number]["value"];
  brand: string;
  model: string;
  model_year: number | null;
  frame_size_label: string;
  frame_size_cm: number | null;
  material: (typeof frameMaterials)[number]["value"] | null;
  groupset_brand: string | null;
  groupset_model: string | null;
  drivetrain: string | null;
  brakes: (typeof brakeTypes)[number]["value"] | null;
  wheel_size: string | null;
  electronic_shifting: boolean;
  shipping_offered: boolean;
  purchase_date: string;
  owner_count: number;
  purchase_proof_available: boolean;
  service_history_available: boolean;
  price_dkk: number;
  condition: (typeof conditions)[number]["value"];
  city: string;
  cover_url: string | null;
  cover_alt: string | null;
};

export type ListingOwnershipPeriod = {
  owner_sequence: number;
  started_on: string;
  ended_on: string | null;
  is_current_listing_owner: boolean;
};

export type ListingFilterOptions = {
  brands: string[];
  sizes: string[];
  minPrice: number;
  maxPrice: number;
};

export type ListingComponentChange = {
  id: string;
  category: ComponentCategory;
  previous_component: string | null;
  replacement_brand: string | null;
  replacement_model: string;
  changed_on: string | null;
  notes: string | null;
  documentation_available: boolean;
};

export const componentCategories = [
  { value: "frame", label: "Stel" },
  { value: "fork", label: "Forgaffel" },
  { value: "groupset", label: "Geargruppe" },
  { value: "crankset", label: "Kranksæt" },
  { value: "cassette", label: "Kassette" },
  { value: "chain", label: "Kæde" },
  { value: "brakes", label: "Bremser" },
  { value: "wheels", label: "Hjul" },
  { value: "tires", label: "Dæk" },
  { value: "cockpit", label: "Styr og frempind" },
  { value: "saddle", label: "Sadel" },
  { value: "pedals", label: "Pedaler" },
  { value: "other", label: "Andet" },
] as const;

export type ComponentCategory =
  (typeof componentCategories)[number]["value"];

export type ListingImage = {
  id: string;
  image_url: string;
  alt_text: string;
  width: number | null;
  height: number | null;
};
