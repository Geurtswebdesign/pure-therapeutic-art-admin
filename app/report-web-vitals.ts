"use client";

import { trackPerformanceMetric } from "@/lib/analytics/track";

type WebVitalsMetric = {
  name: string;
  value: number;
};

export function reportWebVitals(metric: WebVitalsMetric) {
  if (!metric?.name) return;
  const value = Number(metric.value);
  if (!Number.isFinite(value)) return;

  trackPerformanceMetric({
    name: metric.name,
    value,
  });
}
