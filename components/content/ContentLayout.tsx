import type { ReactNode } from "react";

export default function ContentLayout({
  children,
  isPreview,
}: {
  children: React.ReactNode;
  isPreview?: boolean;
}) {
  return (
    <main className="max-w-3xl mx-auto py-12">
      {isPreview && (
        <div className="mb-6 rounded bg-yellow-100 text-yellow-800 px-4 py-2 text-sm">
          🔍 Preview mode – conceptinhoud zichtbaar (alleen admin)
        </div>
      )}

      {children}
    </main>
  );
}
