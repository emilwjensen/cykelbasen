import type { ReactNode } from "react";

type FilterFieldProps = {
  children: ReactNode;
  htmlFor: string;
  label: string;
  hint?: string;
};

export function ListingFilterField({
  children,
  hint,
  htmlFor,
  label,
}: FilterFieldProps) {
  return (
    <div className="listing-filter-field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && <span className="listing-filter-field__hint">{hint}</span>}
    </div>
  );
}

type FilterGroupProps = {
  children: ReactNode;
  description: string;
  legend: string;
  variant: "identity" | "price" | "details";
};

export function ListingFilterGroup({
  children,
  description,
  legend,
  variant,
}: FilterGroupProps) {
  return (
    <fieldset
      className={`listing-filter-group listing-filter-group--${variant}`}
    >
      <legend>{legend}</legend>
      <p className="listing-filter-group__description">{description}</p>
      <div
        className={`listing-filter-group__grid listing-filter-group__grid--${variant}`}
      >
        {children}
      </div>
    </fieldset>
  );
}
