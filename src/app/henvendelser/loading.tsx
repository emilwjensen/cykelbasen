import { AccountNavigation } from "@/components/account-navigation";

export default function ContactRequestsLoading() {
  return (
    <div className="account-page shell">
      <AccountNavigation />
      <div className="loading-state">Henter henvendelser…</div>
    </div>
  );
}
