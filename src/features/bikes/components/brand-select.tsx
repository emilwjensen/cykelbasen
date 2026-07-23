"use client";

import { useState } from "react";
import { bikeBrands } from "../catalog";

type BrandSelectProps = {
  defaultBrand?: string | null;
};

export function BrandSelect({ defaultBrand }: BrandSelectProps) {
  const isKnownBrand = bikeBrands.some((brand) => brand === defaultBrand);
  const [selection, setSelection] = useState(
    defaultBrand ? (isKnownBrand ? defaultBrand : "other") : "",
  );

  return (
    <div className="brand-select">
      <label className="form-field">
        Mærke
        <select
          name="brandSelection"
          onChange={(event) => setSelection(event.target.value)}
          required
          value={selection}
        >
          <option value="">Vælg mærke</option>
          {bikeBrands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
          <option value="other">Andet mærke</option>
        </select>
      </label>
      {selection === "other" && (
        <label className="form-field">
          Skriv mærket
          <input
            defaultValue={isKnownBrand ? "" : (defaultBrand ?? "")}
            maxLength={60}
            name="customBrand"
            placeholder="Fx custom stelbygger"
            required
          />
        </label>
      )}
    </div>
  );
}
