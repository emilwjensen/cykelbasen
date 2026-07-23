import { AccountNavigation } from "@/components/account-navigation";

export default function SellerDashboardLoading() {
  return (
    <div className="account-page shell" aria-busy="true">
      <AccountNavigation />
      <div className="skeleton skeleton--heading" />
      <div className="skeleton skeleton--filters" />
    </div>
  );
}
