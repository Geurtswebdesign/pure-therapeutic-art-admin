"use client";

import { useFormState } from "react-dom";
import { adjustCredits, CreditActionResult } from "../actions";

const initialState: CreditActionResult = { success: true };

export default function CreditButtons({
  userId,
}: {
  userId: string;
}) {
  const [state, formAction] = useFormState(adjustCredits, initialState);

  return (
    <div className="space-y-1">
      <form action={formAction} className="inline space-x-1">
        <input type="hidden" name="user_id" value={userId} />
        <input type="hidden" name="delta" value="10" />
        <button className="px-2 py-1 text-xs border rounded">
          +10
        </button>
      </form>

      <form action={formAction} className="inline space-x-1">
        <input type="hidden" name="user_id" value={userId} />
        <input type="hidden" name="delta" value="-10" />
        <button className="px-2 py-1 text-xs border rounded">
          −10
        </button>
      </form>

      {state.message && (
        <div
          className={`text-xs ${
            state.success ? "text-green-600" : "text-red-600"
          }`}
        >
          {state.message}
        </div>
      )}
    </div>
  );
}
