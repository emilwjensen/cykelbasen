"use client";

import { useActionState } from "react";
import type { DraftListingInput } from "../draft-schema";
import type { ListingFormState } from "../draft-types";
import {
  bikeCategories,
  brakeTypes,
  conditions,
  frameMaterials,
} from "../types";

type ListingFormProps = {
  action: (
    state: ListingFormState,
    formData: FormData,
  ) => Promise<ListingFormState>;
  initialValues?: Partial<DraftListingInput>;
  submitLabel: string;
};

const initialState: ListingFormState = {};

function FieldError({
  errors,
  name,
}: {
  errors?: Record<string, string[]>;
  name: string;
}) {
  const message = errors?.[name]?.[0];
  return message ? <small className="field-error">{message}</small> : null;
}

export function ListingForm({
  action,
  initialValues = {},
  submitLabel,
}: ListingFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="listing-form">
      {initialValues.garageBikeId && (
        <input
          name="garageBikeId"
          type="hidden"
          value={initialValues.garageBikeId}
        />
      )}
      {state.message && (
        <p className="form-message form-message--error">{state.message}</p>
      )}

      <fieldset>
        <legend>Det vigtigste</legend>
        <div className="form-grid form-grid--two">
          <label className="form-field form-field--wide">
            Annoncetitel
            <input
              defaultValue={initialValues.title}
              maxLength={100}
              minLength={8}
              name="title"
              placeholder="Fx Specialized Tarmac SL7 Comp"
              required
            />
            <FieldError errors={state.errors} name="title" />
          </label>

          <label className="form-field">
            Type
            <select
              defaultValue={initialValues.category ?? ""}
              name="category"
              required
            >
              <option disabled value="">
                Vælg type
              </option>
              {bikeCategories.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldError errors={state.errors} name="category" />
          </label>

          <label className="form-field">
            Mærke
            <input
              defaultValue={initialValues.brand}
              maxLength={60}
              name="brand"
              placeholder="Fx Canyon"
              required
            />
            <FieldError errors={state.errors} name="brand" />
          </label>

          <label className="form-field">
            Model
            <input
              defaultValue={initialValues.model}
              maxLength={80}
              name="model"
              placeholder="Fx Ultimate CF SL"
              required
            />
            <FieldError errors={state.errors} name="model" />
          </label>

          <label className="form-field">
            Modelår
            <input
              defaultValue={initialValues.modelYear}
              max={2100}
              min={1950}
              name="modelYear"
              placeholder="2022"
              type="number"
            />
            <FieldError errors={state.errors} name="modelYear" />
          </label>

          <label className="form-field">
            Størrelsesmærke
            <input
              defaultValue={initialValues.frameSizeLabel}
              maxLength={20}
              name="frameSizeLabel"
              placeholder="Fx 56 / L"
              required
            />
            <FieldError errors={state.errors} name="frameSizeLabel" />
          </label>

          <label className="form-field">
            Stelstørrelse i cm
            <input
              defaultValue={initialValues.frameSizeCm}
              max={75}
              min={35}
              name="frameSizeCm"
              placeholder="56"
              step="0.5"
              type="number"
            />
            <FieldError errors={state.errors} name="frameSizeCm" />
          </label>

          <label className="form-field">
            Stand
            <select
              defaultValue={initialValues.condition ?? ""}
              name="condition"
              required
            >
              <option disabled value="">
                Vælg stand
              </option>
              {conditions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldError errors={state.errors} name="condition" />
          </label>

          <label className="form-field">
            Pris i kr.
            <input
              defaultValue={initialValues.priceDkk}
              inputMode="numeric"
              max={1_000_000}
              min={1}
              name="priceDkk"
              placeholder="18.500"
              required
              type="number"
            />
            <FieldError errors={state.errors} name="priceDkk" />
          </label>

          <label className="form-field">
            By
            <input
              defaultValue={initialValues.city}
              maxLength={80}
              minLength={2}
              name="city"
              placeholder="Fx København"
              required
            />
            <FieldError errors={state.errors} name="city" />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Udstyr og stel</legend>
        <p className="fieldset-intro">
          Valgfrie felter gør annoncen nemmere at finde og sammenligne.
        </p>
        <div className="form-grid form-grid--three">
          <label className="form-field">
            Stelmateriale
            <select defaultValue={initialValues.material ?? ""} name="material">
              <option value="">Ikke angivet</option>
              {frameMaterials.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            Geargruppemærke
            <input
              defaultValue={initialValues.groupsetBrand}
              maxLength={60}
              name="groupsetBrand"
              placeholder="Fx Shimano"
            />
          </label>

          <label className="form-field">
            Geargruppemodel
            <input
              defaultValue={initialValues.groupsetModel}
              maxLength={80}
              name="groupsetModel"
              placeholder="Fx Ultegra Di2"
            />
          </label>

          <label className="form-field">
            Drivlinje
            <input
              defaultValue={initialValues.drivetrain}
              maxLength={20}
              name="drivetrain"
              placeholder="Fx 2x12"
            />
          </label>

          <label className="form-field">
            Bremser
            <select defaultValue={initialValues.brakes ?? ""} name="brakes">
              <option value="">Ikke angivet</option>
              {brakeTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="form-field">
            Hjulstørrelse
            <input
              defaultValue={initialValues.wheelSize}
              maxLength={30}
              name="wheelSize"
              placeholder="Fx 700c"
            />
          </label>
        </div>

        <div className="check-grid">
          <label className="check-field">
            <input
              defaultChecked={initialValues.electronicShifting}
              name="electronicShifting"
              type="checkbox"
            />
            <span>
              <strong>Elektronisk gearskifte</strong>
              <small>Fx Di2, eTap eller EPS</small>
            </span>
          </label>
          <label className="check-field">
            <input
              defaultChecked={initialValues.shippingOffered}
              name="shippingOffered"
              type="checkbox"
            />
            <span>
              <strong>Forsendelse tilbydes</strong>
              <small>Aftales direkte med køber</small>
            </span>
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Ejerskab og historik</legend>
        <p className="fieldset-intro">
          De synlige oplysninger hjælper køberen med at forstå cyklens historik.
          Dokumenter og stelnummer forbliver private.
        </p>
        <div className="form-grid form-grid--two">
          <label className="form-field">
            Din købsdato
            <input
              defaultValue={initialValues.purchaseDate}
              max={new Date().toISOString().slice(0, 10)}
              name="purchaseDate"
              required
              type="date"
            />
            <FieldError errors={state.errors} name="purchaseDate" />
          </label>

          <label className="form-field">
            Kendt antal ejere inkl. dig
            <select
              defaultValue={initialValues.ownerCount ?? 1}
              name="ownerCount"
              required
            >
              {Array.from({ length: 10 }, (_, index) => index + 1).map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
            <FieldError errors={state.errors} name="ownerCount" />
          </label>
        </div>

        <div className="check-grid">
          <label className="check-field">
            <input
              defaultChecked={initialValues.purchaseProofAvailable}
              name="purchaseProofAvailable"
              type="checkbox"
            />
            <span>
              <strong>Købsdokumentation findes</strong>
              <small>Kvittering, slutseddel eller tilsvarende</small>
            </span>
          </label>
          <label className="check-field">
            <input
              defaultChecked={initialValues.serviceHistoryAvailable}
              name="serviceHistoryAvailable"
              type="checkbox"
            />
            <span>
              <strong>Servicehistorik findes</strong>
              <small>Værkstedsbilag eller egen vedligeholdelseslog</small>
            </span>
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Beskrivelse</legend>
        <label className="form-field">
          Fortæl om cyklens stand og historik
          <textarea
            defaultValue={initialValues.description}
            maxLength={5000}
            minLength={20}
            name="description"
            placeholder="Beskriv service, brugsspor, opgraderinger og hvorfor cyklen sælges."
            required
            rows={8}
          />
          <FieldError errors={state.errors} name="description" />
        </label>
      </fieldset>

      <div className="listing-form__submit">
        <div>
          <strong>Gemmes som kladde</strong>
          <p>Intet bliver offentliggjort endnu.</p>
        </div>
        <button
          className="button button--accent"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Gemmer…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
