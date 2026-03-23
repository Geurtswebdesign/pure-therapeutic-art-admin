"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteShopCatalogItem } from "@/lib/settings/actions";

type Props = {
  itemId: string;
  title: string;
  className?: string;
  redirectTo?: string;
};

export default function DeleteShopItemButton({
  itemId,
  title,
  className,
  redirectTo,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    const confirmed = window.confirm(
      `Weet je zeker dat je "${title}" wilt verwijderen?`
    );

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      setError(null);

      try {
        await deleteShopCatalogItem(itemId);
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.refresh();
        }
      } catch (deleteError) {
        setError(
          deleteError instanceof Error
            ? deleteError.message
            : "Verwijderen mislukt."
        );
      }
    });
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={isPending}
        className={
          className ??
          "text-red-600 transition hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        }
        onClick={handleDelete}
      >
        {isPending ? "Verwijderen..." : "Verwijderen"}
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
