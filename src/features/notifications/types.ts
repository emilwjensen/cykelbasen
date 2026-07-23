export type NotificationItem = {
  id: string;
  notification_type:
    | "contact-request"
    | "ownership-review"
    | "listing-reserved"
    | "maintenance-due"
    | "system";
  title: string;
  body: string;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

export type DueMaintenanceNotification = {
  id: string;
  bike_id: string;
  bike_name: string;
  title: string;
  due_on: string | null;
  due_odometer_km: number | null;
  current_odometer_km: number;
};
