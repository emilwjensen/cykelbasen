export default function BrowseLoading() {
  return (
    <div className="shell browse" aria-busy="true" aria-label="Henter cykler">
      <div className="skeleton skeleton--heading" />
      <div className="skeleton skeleton--filters" />
      <div className="skeleton skeleton--toolbar" />
      <div className="listing-grid">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div className="skeleton skeleton--card" key={item} />
        ))}
      </div>
    </div>
  );
}
