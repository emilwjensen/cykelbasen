"use client";

import { useActionState } from "react";
import { createBikeTransferAction } from "../actions";
import type { BikeTransferState } from "../types";

const initialState: BikeTransferState = {};

export function BikeTransferForm({ bikeId }: { bikeId: string }) {
  const [state, formAction, pending] = useActionState(
    createBikeTransferAction.bind(null, bikeId),
    initialState,
  );

  return (
    <section className="bike-transfer-panel">
      <p className="eyebrow">Ved videresalg</p>
      <h2>Overdrag registreringen</h2>
      <p>
        Opret en engangskode til køberen. Ejerperioderne følger cyklen, mens
        dine private noter, bilag og logs bliver på din konto.
      </p>

      {state.message && (
        <p className="form-message form-message--error">{state.message}</p>
      )}

      {state.code ? (
        <div className="bike-transfer-code">
          <label>
            Overdragelseskode
            <input readOnly value={state.code} />
          </label>
          <small>
            Udløber{" "}
            {state.expiresAt
              ? new Intl.DateTimeFormat("da-DK", {
                  dateStyle: "long",
                  timeStyle: "short",
                }).format(new Date(state.expiresAt))
              : "om 14 dage"}
            . En ny kode annullerer den gamle.
          </small>
        </div>
      ) : (
        <form action={formAction}>
          <button
            className="button button--quiet button--full"
            disabled={pending}
            type="submit"
          >
            {pending ? "Opretter kode…" : "Opret overdragelseskode"}
          </button>
        </form>
      )}
    </section>
  );
}
