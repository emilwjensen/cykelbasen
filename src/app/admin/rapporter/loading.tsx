import { ModerationNavigation } from "@/components/moderation-navigation";

export default function ReportsLoading() {
  return (
    <div className="moderation-page shell">
      <ModerationNavigation />
      <div className="forum-loading" />
      <div className="forum-loading forum-loading--list" />
    </div>
  );
}
