import { AccountNavigation } from "@/components/account-navigation";

export default function MyBikesLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Henter dine cykler"
      className="garage-page shell"
    >
      <AccountNavigation />
      <div className="skeleton skeleton--heading" />
      <div className="garage-grid">
        {[1, 2, 3, 4].map((item) => (
          <div className="skeleton skeleton--card" key={item} />
        ))}
      </div>
    </div>
  );
}
