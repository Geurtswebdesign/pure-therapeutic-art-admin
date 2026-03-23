"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function AccountPanelAutoScroll({
  targetId,
}: {
  targetId: string;
}) {
  const searchParams = useSearchParams();
  const panel = searchParams.get("panel");

  useEffect(() => {
    if (!panel) {
      return;
    }

    const timer = window.setTimeout(() => {
      document
        .getElementById(targetId)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);

    return () => window.clearTimeout(timer);
  }, [panel, targetId]);

  return null;
}
