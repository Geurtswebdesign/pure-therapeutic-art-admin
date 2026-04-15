"use client";

import { useEffect, useTransition, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import TermsTable from "./TermsTable";
import AddTermForm from "./AddTermForm";
import type { Taxonomy, Term } from "./types";

type TermsSortOption =
  | "custom_asc"
  | "name_asc"
  | "name_desc"
  | "updated_desc"
  | "updated_asc"
  | "created_desc"
  | "created_asc";

function normalizeTermsSortOption(value: string | null): TermsSortOption {
  switch (value) {
    case "name_asc":
    case "name_desc":
    case "updated_desc":
    case "updated_asc":
    case "created_desc":
    case "created_asc":
      return value;
    default:
      return "custom_asc";
  }
}

type Props = {
  taxonomy: Taxonomy;
  terms: Term[];
};

export default function TermsClient({ taxonomy, terms }: Props) {
  const [localTerms, setLocalTerms] = useState<Term[]>(terms);
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sort = normalizeTermsSortOption(searchParams.get("sort"));

  useEffect(() => {
    setLocalTerms(terms);
  }, [terms]);

  function setSort(nextSort: TermsSortOption) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextSort === "custom_asc") {
      params.delete("sort");
    } else {
      params.set("sort", nextSort);
    }

    const nextQuery = params.toString();
    const nextHref = nextQuery ? `${pathname}?${nextQuery}` : pathname;

    startTransition(() => {
      router.replace(nextHref, { scroll: false });
    });
  }

  return (
    <div className="grid grid-cols-3 gap-8">
      <div>
        <AddTermForm
          taxonomy={taxonomy}
          terms={localTerms}
          onAdd={(newTerm) =>
            setLocalTerms((prev) => [...prev, newTerm])
          }
        />
      </div>

      <div className="col-span-2">
        <div className="mb-4 flex items-center justify-end gap-2 text-sm">
          <label htmlFor="terms-sort" className="text-stone-600">
            Sorteren op
          </label>
          <select
            id="terms-sort"
            value={sort}
            onChange={(event) =>
              setSort(normalizeTermsSortOption(event.target.value))
            }
            className="rounded border border-stone-300 px-2 py-1"
            disabled={isPending}
          >
            <option value="custom_asc">Handmatige volgorde</option>
            <option value="name_asc">Naam A-Z</option>
            <option value="name_desc">Naam Z-A</option>
            <option value="updated_desc">Datum gewijzigd nieuw → oud</option>
            <option value="updated_asc">Datum gewijzigd oud → nieuw</option>
            <option value="created_desc">Datum aangemaakt nieuw → oud</option>
            <option value="created_asc">Datum aangemaakt oud → nieuw</option>
          </select>
        </div>
        <TermsTable
          taxonomy={taxonomy}
          terms={localTerms}
          sort={sort}
        />
      </div>
    </div>
  );
}
