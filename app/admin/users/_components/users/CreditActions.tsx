"use client";

import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";
import { adjustCredits } from "../../actions";
import { CREDIT_REASONS } from "../../_lib/creditReasons";

type Props = {
  userId: string;
};

export default function CreditActions({ userId }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();

        const formData = new FormData(formRef.current!);
        const delta = Number(formData.get("delta"));
        const reason = String(formData.get("reason"));

        if (Number.isNaN(delta) || delta === 0) return;

        startTransition(async () => {
          await adjustCredits(userId, delta, reason);

          router.refresh(); // ✅ force server re-render

          // ✅ veilig resetten
          formRef.current?.reset();
        });
      }}
      className="space-y-3"
    >
      <input
        type="number"
        name="delta"
        placeholder="+ / −"
        className="w-full border px-2 py-1 rounded"
        required
      />

      <select
        name="reason"
        className="w-full border px-2 py-1 rounded"
        defaultValue="admin"
      >
        {Object.entries(CREDIT_REASONS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 border rounded bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
      >
        {isPending ? "Bezig..." : "Credits aanpassen"}
      </button>
    </form>
  );
}
