import { ModerationNavigation } from "@/components/moderation-navigation";

export default function OwnershipQueueLoading() {
  return (
    <div className="moderation-page shell">
      <ModerationNavigation />
      <div className="loading-state">Henter dokumentation…</div>
    </div>
  );
}
