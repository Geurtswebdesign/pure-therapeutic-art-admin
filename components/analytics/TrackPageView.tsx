"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

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

export default function TrackPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    try {
      if (!pathname) return;
      if (
        pathname.startsWith("/admin") ||
        pathname.startsWith("/api") ||
        pathname.startsWith("/login")
      ) {
        return;
      }

      if (lastPath.current === pathname) return;
      lastPath.current = pathname;

      const anonId = getOrCreateId("pta_anon_id", localStorage);
      const sessionId = getOrCreateId("pta_session_id", sessionStorage);
      const ua = navigator.userAgent || "";
      const params = searchParams ? searchParams.toString() : "";
      const urlParams = new URLSearchParams(params);
      const referrer = document.referrer || "";
      let referrerHost: string | null = null;
      if (referrer) {
        try {
          referrerHost = new URL(referrer).host;
        } catch {
          referrerHost = null;
        }
      }
      const referrerType = referrerHost
        ? isSocialReferrer(referrerHost)
          ? "social"
          : isAiReferrer(referrerHost)
            ? "ai"
            : "referral"
        : "direct";

      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: "pageview",
          path: pathname,
          page_title: document.title || null,
          referrer: referrer || null,
          referrer_host: referrerHost,
          referrer_type: referrerType,
          utm_source: urlParams.get("utm_source"),
          utm_medium: urlParams.get("utm_medium"),
          utm_campaign: urlParams.get("utm_campaign"),
          utm_content: urlParams.get("utm_content"),
          utm_term: urlParams.get("utm_term"),
          utm_id: urlParams.get("utm_id"),
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
      }).catch(() => {
        // noop
      });
    } catch {
      // noop
    }
  }, [pathname, searchParams]);

  return null;
}

function isSocialReferrer(host: string) {
  return (
    host.includes("facebook.com") ||
    host.includes("instagram.com") ||
    host.includes("t.co") ||
    host.includes("x.com") ||
    host.includes("linkedin.com") ||
    host.includes("pinterest.com") ||
    host.includes("reddit.com") ||
    host.includes("tiktok.com") ||
    host.includes("youtube.com")
  );
}

function isAiReferrer(host: string) {
  return (
    host.includes("chat.openai.com") ||
    host.includes("chatgpt.com") ||
    host.includes("perplexity.ai") ||
    host.includes("claude.ai") ||
    host.includes("copilot.microsoft.com")
  );
}
