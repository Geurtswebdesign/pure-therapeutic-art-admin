"use client";

type TrackEventInput = {
  eventName: string;
  eventCategory?: string;
  eventLabel?: string;
  eventValue?: number;
  metadata?: Record<string, string | number | boolean | null>;
};

function createFallbackId() {
  return `pta_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function safeRandomId() {
  try {
    return globalThis.crypto?.randomUUID?.() ?? createFallbackId();
  } catch {
    return createFallbackId();
  }
}

export async function trackEvent(input: TrackEventInput) {
  try {
    const anonId = getOrCreateId("pta_anon_id", localStorage);
    const sessionId = getOrCreateId("pta_session_id", sessionStorage);
    const ua = navigator.userAgent || "";
    const url = new URL(window.location.href);
    const params = url.searchParams;

    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "event",
        event_name: input.eventName,
        event_category: input.eventCategory ?? null,
        event_label: input.eventLabel ?? null,
        event_value: input.eventValue ?? null,
        path: url.pathname,
        page_title: document.title || null,
        utm_source: params.get("utm_source"),
        utm_medium: params.get("utm_medium"),
        utm_campaign: params.get("utm_campaign"),
        utm_content: params.get("utm_content"),
        utm_term: params.get("utm_term"),
        utm_id: params.get("utm_id"),
        anon_id: anonId,
        session_id: sessionId,
        user_agent: ua,
        device_type: detectDeviceType(ua),
        os: detectOS(ua),
        browser: detectBrowser(ua),
        language: navigator.language,
        screen_width: window.innerWidth,
        screen_height: window.innerHeight,
      }),
      keepalive: true,
    });
  } catch {
    // noop
  }
}

export async function trackPerformanceMetric(input: {
  name: string;
  value: number;
}) {
  try {
    const anonId = getOrCreateId("pta_anon_id", localStorage);
    const sessionId = getOrCreateId("pta_session_id", sessionStorage);
    const ua = navigator.userAgent || "";
    const url = new URL(window.location.href);
    const params = url.searchParams;

    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "performance",
        event_name: input.name,
        event_value: input.value,
        path: url.pathname,
        page_title: document.title || null,
        utm_source: params.get("utm_source"),
        utm_medium: params.get("utm_medium"),
        utm_campaign: params.get("utm_campaign"),
        utm_content: params.get("utm_content"),
        utm_term: params.get("utm_term"),
        utm_id: params.get("utm_id"),
        anon_id: anonId,
        session_id: sessionId,
        user_agent: ua,
        device_type: detectDeviceType(ua),
        os: detectOS(ua),
        browser: detectBrowser(ua),
        language: navigator.language,
        screen_width: window.innerWidth,
        screen_height: window.innerHeight,
      }),
      keepalive: true,
    });
  } catch {
    // noop
  }
}

export async function trackException(input: {
  message: string;
  stack?: string;
}) {
  try {
    const anonId = getOrCreateId("pta_anon_id", localStorage);
    const sessionId = getOrCreateId("pta_session_id", sessionStorage);
    const ua = navigator.userAgent || "";
    const url = new URL(window.location.href);

    await fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "exception",
        event_name: "exception",
        path: url.pathname,
        page_title: document.title || null,
        anon_id: anonId,
        session_id: sessionId,
        user_agent: ua,
        device_type: detectDeviceType(ua),
        os: detectOS(ua),
        browser: detectBrowser(ua),
        language: navigator.language,
        screen_width: window.innerWidth,
        screen_height: window.innerHeight,
        event_label: input.stack ?? input.message,
      }),
      keepalive: true,
    });
  } catch {
    // noop
  }
}

function getOrCreateId(key: string, storage: Storage) {
  try {
    const existing = storage.getItem(key);
    if (existing) return existing;
    const created = safeRandomId();
    storage.setItem(key, created);
    return created;
  } catch {
    return safeRandomId();
  }
}

function detectDeviceType(ua: string) {
  if (/ipad|tablet/i.test(ua)) return "tablet";
  if (/mobi|iphone|android/i.test(ua)) return "mobile";
  return "desktop";
}

function detectOS(ua: string) {
  if (/windows/i.test(ua)) return "Windows";
  if (/mac os x/i.test(ua)) return "macOS";
  if (/android/i.test(ua)) return "Android";
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/linux/i.test(ua)) return "Linux";
  return "Other";
}

function detectBrowser(ua: string) {
  if (/edg/i.test(ua)) return "Edge";
  if (/chrome|crios/i.test(ua)) return "Chrome";
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua)) return "Safari";
  return "Other";
}
