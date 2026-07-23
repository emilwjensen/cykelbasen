import type {
  ComponentCategory,
} from "@/features/listings/types";
import { bikeCategories } from "@/features/listings/types";

export const bikeLogTypes = [
  { value: "ride", label: "Tur" },
  { value: "maintenance", label: "Service og vedligehold" },
  { value: "component-change", label: "Komponentudskiftning" },
  { value: "inspection", label: "Kontrol eller inspektion" },
  { value: "note", label: "Anden note" },
] as const;

export type BikeLogType = (typeof bikeLogTypes)[number]["value"];

export type GarageBikeSummary = {
  id: string;
  nickname: string;
  category: (typeof bikeCategories)[number]["value"];
  brand: string;
  model: string;
  model_year: number | null;
  frame_size_label: string | null;
  acquired_on: string;
  ownership_ended_on: string | null;
  current_odometer_km: number;
  log_count: number;
  open_reminder_count: number;
  due_reminder_count: number;
  last_log_on: string | null;
  updated_at: string;
};

export type BikeOwnershipPeriod = {
  owner_sequence: number;
  started_on: string;
  ended_on: string | null;
  is_this_registration: boolean;
};

export type BikeLogEntry = {
  id: string;
  log_type: BikeLogType;
  title: string;
  details: string | null;
  occurred_on: string;
  distance_km: number | null;
  odometer_km: number | null;
  cost_dkk: number | null;
  component_category: ComponentCategory | null;
  component_brand: string | null;
  component_model: string | null;
  documentation_available: boolean;
  created_at: string;
};

export type BikeMaintenanceReminder = {
  id: string;
  title: string;
  component_category: ComponentCategory | null;
  due_on: string | null;
  due_odometer_km: number | null;
  notes: string | null;
  completed_at: string | null;
  completed_log_id: string | null;
  created_at: string;
};

export type GarageBikeDetail = GarageBikeSummary & {
  acquired_used: boolean;
  owner_count_at_acquisition: number;
  has_serial_number: boolean;
  notes: string | null;
  logs: BikeLogEntry[];
  reminders: BikeMaintenanceReminder[];
  ownership_history: BikeOwnershipPeriod[];
};

export type BikeTransferState = {
  code?: string;
  expiresAt?: string;
  message?: string;
};
