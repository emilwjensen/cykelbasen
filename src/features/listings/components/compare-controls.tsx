"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const storageKey = "cykelbasen:comparison";
const changeEvent = "cykelbasen:comparison-change";
const maximumSelections = 3;

export type ComparisonSelection = {
  id: string;
  title: string;
};

function readSelection(): ComparisonSelection[] {
  if (typeof window === "undefined") return [];

  try {
    const value = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]");
    if (!Array.isArray(value)) return [];

    return value
      .filter(
        (item): item is ComparisonSelection =>
          typeof item?.id === "string" && typeof item?.title === "string",
      )
      .slice(0, maximumSelections);
  } catch {
    return [];
  }
}

function writeSelection(selection: ComparisonSelection[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(selection));
  window.dispatchEvent(new Event(changeEvent));
}

function useComparisonSelection() {
  const [selection, setSelection] = useState<ComparisonSelection[]>([]);

  useEffect(() => {
    const update = () => setSelection(readSelection());
    update();
    window.addEventListener(changeEvent, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(changeEvent, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return selection;
}

export function CompareButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const selection = useComparisonSelection();
  const selected = selection.some((item) => item.id === id);
  const selectionFull = selection.length >= maximumSelections && !selected;

  function toggle() {
    if (selected) {
      writeSelection(selection.filter((item) => item.id !== id));
      return;
    }
    if (!selectionFull) writeSelection([...selection, { id, title }]);
  }

  return (
    <button
      aria-pressed={selected}
      className={`compare-button${selected ? " is-selected" : ""}`}
      disabled={selectionFull}
      onClick={toggle}
      title={selectionFull ? "Du kan sammenligne op til tre cykler" : undefined}
      type="button"
    >
      <span aria-hidden="true">{selected ? "✓" : "+"}</span>
      {selected
        ? "Valgt til sammenligning"
        : selectionFull
          ? "Maks. 3 valgt"
          : "Sammenlign"}
    </button>
  );
}

export function ComparisonTray() {
  const selection = useComparisonSelection();
  const pathname = usePathname();

  if (!selection.length || pathname === "/sammenlign") return null;

  const comparisonUrl = `/sammenlign?ids=${selection
    .map((item) => item.id)
    .join(",")}`;

  return (
    <aside aria-live="polite" className="comparison-tray">
      <div>
        <strong>{selection.length} af 3 cykler valgt</strong>
        <span>
          {selection.map((item) => item.title).join(" · ")}
        </span>
      </div>
      <div className="comparison-tray__actions">
        <button onClick={() => writeSelection([])} type="button">
          Ryd
        </button>
        {selection.length >= 2 ? (
          <Link className="button button--accent" href={comparisonUrl}>
            Sammenlign nu
          </Link>
        ) : (
          <span className="comparison-tray__hint">Vælg én mere</span>
        )}
      </div>
    </aside>
  );
}

export function ComparisonSelectionSync({
  listings,
}: {
  listings: ComparisonSelection[];
}) {
  useEffect(() => {
    writeSelection(listings.slice(0, maximumSelections));
  }, [listings]);

  return null;
}

export function RemoveComparisonButton({
  id,
  ids,
}: {
  id: string;
  ids: string[];
}) {
  const router = useRouter();

  function remove() {
    const nextIds = ids.filter((candidate) => candidate !== id);
    writeSelection(readSelection().filter((item) => item.id !== id));
    router.replace(
      nextIds.length
        ? `/sammenlign?ids=${nextIds.join(",")}`
        : "/sammenlign",
    );
  }

  return (
    <button className="comparison-remove" onClick={remove} type="button">
      Fjern
    </button>
  );
}
