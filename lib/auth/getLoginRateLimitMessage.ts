import type { UiLanguage } from "@/lib/i18n/runtime";

export function getLoginRateLimitMessage(
  language: UiLanguage,
  minutes: number | null
) {
  const safeMinutes =
    typeof minutes === "number" && Number.isFinite(minutes) && minutes > 0
      ? Math.ceil(minutes)
      : null;

  if (language === "en") {
    return safeMinutes
      ? `Too many login attempts. Try again in about ${safeMinutes} minute${safeMinutes === 1 ? "" : "s"}.`
      : "Too many login attempts. Try again later.";
  }

  if (language === "de") {
    return safeMinutes
      ? `Zu viele Anmeldeversuche. Bitte versuche es in etwa ${safeMinutes} Minute${safeMinutes === 1 ? "" : "n"} erneut.`
      : "Zu viele Anmeldeversuche. Bitte versuche es spaeter erneut.";
  }

  return safeMinutes
    ? `Te veel loginpogingen. Probeer het over ongeveer ${safeMinutes} minuut${safeMinutes === 1 ? "" : "en"} opnieuw.`
    : "Te veel loginpogingen. Probeer het later opnieuw.";
}
