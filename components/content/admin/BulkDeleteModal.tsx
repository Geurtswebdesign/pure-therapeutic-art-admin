"use client";

type Props = {
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

export default function BulkDeleteModal({
  count,
  onConfirm,
  onCancel,
  loading,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded bg-white p-5 shadow-lg">
        <h2 className="text-lg font-semibold mb-2">
          Items verwijderen
        </h2>

        <p className="text-sm text-gray-700 mb-4">
          Weet je zeker dat je <strong>{count}</strong> item(s) wilt verwijderen?
          <br />
          <span className="text-red-600">
            Deze actie kan niet ongedaan worden gemaakt.
          </span>
        </p>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="border px-3 py-1.5 text-sm rounded hover:bg-gray-100"
          >
            Annuleren
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 text-white px-3 py-1.5 text-sm rounded hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Bezig…" : "Verwijderen"}
          </button>
        </div>
      </div>
    </div>
  );
}
