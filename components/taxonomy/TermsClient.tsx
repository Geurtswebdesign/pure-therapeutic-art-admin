"use client";

import { useEffect, useState } from "react";
import TermsTable from "./TermsTable";
import AddTermForm from "./AddTermForm";
import type { Taxonomy, Term } from "./types";

type Props = {
  taxonomy: Taxonomy;
  terms: Term[];
};

export default function TermsClient({ taxonomy, terms }: Props) {
  const [localTerms, setLocalTerms] = useState<Term[]>(terms);

  useEffect(() => {
    setLocalTerms(terms);
  }, [terms]);

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
        <TermsTable
          taxonomy={taxonomy}
          terms={localTerms}
        />
      </div>
    </div>
  );
}
