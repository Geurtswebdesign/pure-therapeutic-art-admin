"use client";

import { useEffect } from "react";
import { trackException } from "@/lib/analytics/track";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    trackException({
      message: error.message || "Unexpected error",
      stack: error.stack,
    });
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-white text-gray-900">
        <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-2xl font-semibold">Er ging iets mis</h1>
          <p className="text-sm text-gray-600">
            Probeer het opnieuw of ga terug naar de vorige pagina.
          </p>
          <button
            onClick={reset}
            className="rounded bg-black px-4 py-2 text-sm text-white"
          >
            Opnieuw proberen
          </button>
        </main>
      </body>
    </html>
  );
}
