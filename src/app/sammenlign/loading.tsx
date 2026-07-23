export default function ComparisonLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Henter sammenligning"
      className="comparison-page shell"
    >
      <div className="skeleton skeleton--heading" />
      <div className="skeleton skeleton--filters" />
      <div className="listing-grid">
        {[1, 2, 3].map((item) => (
          <div className="skeleton skeleton--card" key={item} />
        ))}
      </div>
    </div>
  );
}
