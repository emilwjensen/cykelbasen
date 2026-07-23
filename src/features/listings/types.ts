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
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  material?: (typeof frameMaterials)[number]["value"];
  brakes?: (typeof brakeTypes)[number]["value"];
  condition?: (typeof conditions)[number]["value"];
  city?: string;
  sort: (typeof sortOptions)[number]["value"];
};

export type ListingSummary = {
  id: string;
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
  total_count: number;
};

export type ListingDetail = ListingSummary & {
  frame_size_cm: number | null;
  groupset_brand: string | null;
  groupset_model: string | null;
  drivetrain: string | null;
  brakes: (typeof brakeTypes)[number]["value"] | null;
  wheel_size: string | null;
  electronic_shifting: boolean;
  shipping_offered: boolean;
  description: string;
  seller_name: string;
  seller_city: string | null;
  images: ListingImage[];
};

export type ListingImage = {
  id: string;
  image_url: string;
  alt_text: string;
  width: number | null;
  height: number | null;
};

