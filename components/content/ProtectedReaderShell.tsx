"use client";

import { useEffect } from "react";

type Props = {
  children: React.ReactNode;
  watermarkText: string;
};

export default function ProtectedReaderShell({
  children,
  watermarkText,
}: Props) {
  useEffect(() => {
    function preventCopy(event: ClipboardEvent) {
      event.preventDefault();
    }

    function preventContext(event: MouseEvent) {
      event.preventDefault();
    }

    function preventDrag(event: DragEvent) {
      event.preventDefault();
    }

    function preventSelection(event: Event) {
      event.preventDefault();
    }

    function preventShortcuts(event: KeyboardEvent) {
      const key = event.key.toLowerCase();
      const hasModifier = event.metaKey || event.ctrlKey;
      if (!hasModifier) {
        return;
      }

      if (key === "c" || key === "x" || key === "p" || key === "s") {
        event.preventDefault();
      }
    }

    document.addEventListener("copy", preventCopy);
    document.addEventListener("cut", preventCopy);
    document.addEventListener("contextmenu", preventContext);
    document.addEventListener("dragstart", preventDrag);
    document.addEventListener("selectstart", preventSelection);
    document.addEventListener("keydown", preventShortcuts);
    window.addEventListener("beforeprint", preventSelection);

    return () => {
      document.removeEventListener("copy", preventCopy);
      document.removeEventListener("cut", preventCopy);
      document.removeEventListener("contextmenu", preventContext);
      document.removeEventListener("dragstart", preventDrag);
      document.removeEventListener("selectstart", preventSelection);
      document.removeEventListener("keydown", preventShortcuts);
      window.removeEventListener("beforeprint", preventSelection);
    };
  }, []);

  return (
    <div className="relative select-none" onContextMenu={(event) => event.preventDefault()}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="grid h-full grid-cols-2 opacity-[0.06] sm:grid-cols-3">
          {Array.from({ length: 18 }).map((_, index) => (
            <div
              key={`reader-watermark-${index}`}
              className="flex items-center justify-center px-4 py-10 text-center text-[11px] uppercase tracking-[0.28em] text-stone-700"
              style={{ transform: "rotate(-24deg)" }}
            >
              {watermarkText}
            </div>
          ))}
        </div>
      </div>

      <div className="relative">{children}</div>
    </div>
  );
}
