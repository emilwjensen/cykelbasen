import Link from "next/link";
import {
  bikeCategories,
  brakeTypes,
  conditions,
  frameMaterials,
  sortOptions,
  type ListingFilters,
} from "../types";

type ListingFiltersProps = {
  filters: ListingFilters;
};

export function ListingFilterForm({ filters }: ListingFiltersProps) {
  return (
    <form action="/cykler" className="filters">
      <div className="filters__search">
        <label htmlFor="q">Søg efter mærke eller model</label>
        <input
          defaultValue={filters.q}
          id="q"
          name="q"
          placeholder="Fx Specialized Tarmac"
          type="search"
        />
      </div>

      <div className="filters__grid">
        <label>
          Type
          <select defaultValue={filters.category ?? ""} name="category">
            <option value="">Alle typer</option>
            {bikeCategories.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Stelstørrelse
          <input
            defaultValue={filters.size}
            name="size"
            placeholder="Fx 56 eller M"
          />
        </label>

        <label>
          Pris fra
          <input
            defaultValue={filters.minPrice}
            inputMode="numeric"
            min="0"
            name="minPrice"
            placeholder="5.000"
            type="number"
          />
        </label>

        <label>
          Pris til
          <input
            defaultValue={filters.maxPrice}
            inputMode="numeric"
            min="0"
            name="maxPrice"
            placeholder="30.000"
            type="number"
          />
        </label>

        <label>
          Stelmateriale
          <select defaultValue={filters.material ?? ""} name="material">
            <option value="">Alle materialer</option>
            {frameMaterials.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Bremser
          <select defaultValue={filters.brakes ?? ""} name="brakes">
            <option value="">Alle bremsetyper</option>
            {brakeTypes.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Stand
          <select defaultValue={filters.condition ?? ""} name="condition">
            <option value="">Alle stande</option>
            {conditions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          By
          <input
            defaultValue={filters.city}
            name="city"
            placeholder="Fx Aarhus"
          />
        </label>
      </div>

      <div className="filters__actions">
        <label className="filters__sort">
          Sortér
          <select defaultValue={filters.sort} name="sort">
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button className="button button--dark" type="submit">
          Vis cykler
        </button>
        <Link className="button button--quiet" href="/cykler">
          Nulstil
        </Link>
      </div>
    </form>
  );
}

