import { ModerationNavigation } from "@/components/moderation-navigation";

export default function ListingReportsLoading() {
  return (
    <div className="moderation-page shell">
      <ModerationNavigation />
      <div className="loading-state">Henter annoncerapporter…</div>
    </div>
  );
}
