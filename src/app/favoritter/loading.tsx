import { AccountNavigation } from "@/components/account-navigation";

export default function FavoritesLoading() {
  return (
    <div className="browse shell">
      <AccountNavigation />
      <div className="loading-state">Henter dine favoritter…</div>
    </div>
  );
}
