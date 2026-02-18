"use client";

import { useTransition } from "react";
import { unlockContent } from "@/lib/unlock/unlockContent";
import { useWallet } from "@/components/providers/WalletProvider";

export default function LockedView({
  contentId,
  cost,
}: {
  contentId: string;
  cost: number;
}) {
  const [isPending, startTransition] = useTransition();
  const { applyDelta, refresh } = useWallet();

  function handleUnlock() {
    startTransition(async () => {
      // ✅ Optimistic
      applyDelta(-cost);

      try {
        await unlockContent({ contentItemId: contentId, cost });
        // ✅ Sync to server truth (optional maar aanbevolen)
        await refresh();
      } catch (e) {
        // ✅ Rollback
        applyDelta(+cost);

        const message =
          e instanceof Error ? e.message : "Ontgrendelen mislukt";
        alert(message);
      }
    });
  }

  return (
    <div className="max-w-xl mx-auto py-20 text-center">
      <h2 className="text-2xl font-semibold mb-4">Deze content is vergrendeld</h2>
      <p className="mb-6">Ontgrendel voor {cost} credits.</p>

      <button
        onClick={handleUnlock}
        disabled={isPending}
        className="px-6 py-3 rounded bg-black text-white disabled:opacity-50"
      >
        {isPending ? "Bezig..." : "Ontgrendel"}
      </button>
    </div>
  );
}
