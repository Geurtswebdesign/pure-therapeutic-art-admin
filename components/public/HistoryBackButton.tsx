"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

type Props = {
  children: ReactNode;
  className?: string;
  fallbackHref?: string;
};

export default function HistoryBackButton({
  children,
  className,
  fallbackHref = "/",
}: Props) {
  const router = useRouter();

  function handleClick() {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
