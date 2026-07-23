import { AccountNavigation } from "@/components/account-navigation";

export default function ProfileLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Henter din profil"
      className="account-page shell"
    >
      <AccountNavigation />
      <div className="skeleton skeleton--heading" />
      <div className="skeleton skeleton--filters" />
    </div>
  );
}
