"use client";

import { useTransition } from "react";
import { unlockContent } from "@/lib/unlock/unlockContent";

export default function LockedView({
  contentId,
  cost,
}: {
  contentId: string;
  cost: number;
}) {
  const [isPending, startTransition] = useTransition();

  function handleUnlock() {
    startTransition(async () => {
      await unlockContent({
        contentItemId: contentId,
        cost,
      });
    });
  }

  return (
    <div className="max-w-xl mx-auto py-20 text-center">
      <h2 className="text-2xl font-semibold mb-4">
        Deze content is vergrendeld
      </h2>

      <p className="mb-6">
        Ontgrendel deze content voor {cost} credits.
      </p>

      <button
        onClick={handleUnlock}
        disabled={isPending}
        className="px-6 py-3 bg-black text-white rounded"
      >
        {isPending ? "Bezig..." : "Ontgrendel"}
      </button>
    </div>
  );
}
