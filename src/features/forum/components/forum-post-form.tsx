"use client";

import { useActionState } from "react";
import type { ForumCategory, ForumFormState } from "../types";

type ForumPostFormProps = {
  action: (
    state: ForumFormState,
    formData: FormData,
  ) => Promise<ForumFormState>;
  categories: ForumCategory[];
  initialValues?: {
    categorySlug?: string;
    title?: string;
    body?: string;
  };
  submitLabel: string;
};

const initialState: ForumFormState = {};

export function ForumPostForm({
  action,
  categories,
  initialValues,
  submitLabel,
}: ForumPostFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="forum-editor">
      <label>
        <span>Kategori</span>
        <select
          defaultValue={initialValues?.categorySlug ?? ""}
          name="categorySlug"
          required
        >
          <option disabled value="">
            Vælg kategori
          </option>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
        {state.errors?.categorySlug?.map((error) => (
          <small className="field-error" key={error}>
            {error}
          </small>
        ))}
      </label>

      <label>
        <span>Titel</span>
        <input
          defaultValue={initialValues?.title}
          maxLength={140}
          minLength={8}
          name="title"
          placeholder="Hvad vil du gerne spørge om eller dele?"
          required
        />
        {state.errors?.title?.map((error) => (
          <small className="field-error" key={error}>
            {error}
          </small>
        ))}
      </label>

      <label>
        <span>Indlæg</span>
        <textarea
          defaultValue={initialValues?.body}
          maxLength={10_000}
          minLength={20}
          name="body"
          placeholder="Tilføj den kontekst, der gør det let at give et godt svar."
          required
          rows={12}
        />
        {state.errors?.body?.map((error) => (
          <small className="field-error" key={error}>
            {error}
          </small>
        ))}
      </label>

      {state.message && (
        <p className="form-message form-message--error">{state.message}</p>
      )}

      <div className="forum-editor__actions">
        <button className="button button--accent" disabled={pending} type="submit">
          {pending ? "Gemmer…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
