export const bikeBrands = [
  "Argon 18",
  "Avenue",
  "Bianchi",
  "BMC",
  "Cannondale",
  "Canyon",
  "Cervélo",
  "Colnago",
  "Cube",
  "Factor",
  "Felt",
  "Focus",
  "Fuji",
  "Giant",
  "Koga",
  "Lapierre",
  "Look",
  "Merida",
  "Orbea",
  "Pinarello",
  "Principia",
  "Ridley",
  "Rose",
  "Scott",
  "Specialized",
  "Trek",
  "Van Rysel",
  "Wilier",
] as const;

export const groupsetBrands = [
  "Shimano",
  "SRAM",
  "Campagnolo",
  "Microshift",
  "FSA",
] as const;

export const acquisitionSources = [
  { value: "dealer", label: "Cykelforhandler" },
  { value: "private-sale", label: "Privat handel" },
  { value: "marketplace", label: "Online markedsplads" },
  { value: "gift", label: "Gave eller arv" },
  { value: "other", label: "Andet" },
] as const;

export const bikeDocumentTypes = [
  { value: "purchase-receipt", label: "Købskvittering" },
  { value: "sales-agreement", label: "Købsaftale" },
  { value: "service-receipt", label: "Servicebilag" },
  { value: "warranty", label: "Garanti" },
  { value: "insurance", label: "Forsikring" },
  { value: "appraisal", label: "Vurdering" },
  { value: "other", label: "Andet dokument" },
] as const;

export type BikeDocumentType =
  (typeof bikeDocumentTypes)[number]["value"];
