import { headers } from "next/headers";
import {
  AUTH_FRAME_COPY,
  AuthShell,
} from "@/components/login/AuthFrame";
import ResetPasswordForm from "@/components/login/ResetPasswordForm";
import { getAppMessages } from "@/lib/i18n/appMessages";
import { getAppLanguage } from "@/lib/i18n/getAppLanguage";
import { resolveUiLanguage } from "@/lib/i18n/runtime";
import { isNativeAppUserAgent } from "@/lib/native/isNativeAppRequest";
import { getPublicBranding } from "@/lib/settings/public";
import { getAdminLoginUrl, getRequestHost, isAdminHost } from "@/lib/site/urls";

export default async function ResetPasswordPage() {
  const requestHeaders = await headers();
  const requestHost = getRequestHost(requestHeaders);
  const adminRequestHost = isAdminHost(requestHost);
  const language = resolveUiLanguage(await getAppLanguage());
  const t = getAppMessages(language).login;
  const frameCopy = AUTH_FRAME_COPY[language];
  const branding = await getPublicBranding();
  const isNativeApp = isNativeAppUserAgent(requestHeaders.get("user-agent"));
  const loginHref = adminRequestHost
    ? getAdminLoginUrl(undefined, requestHost)
    : "/login";

  return (
    <AuthShell
      siteName={branding.siteName}
      logoUrl={branding.logoUrl}
      title={t.resetTitle}
      eyebrow={frameCopy.eyebrow}
      backLabel={t.backToLogin}
      backHref={loginHref}
      isNativeApp={isNativeApp}
    >
      <section className="space-y-4">
        <div className="rounded-[1.5rem] border border-[#e5d8ca] bg-white/85 p-4 shadow-sm">
          <p className="text-sm leading-6 text-[#6b5d50]">{t.resetIntro}</p>
        </div>

        <ResetPasswordForm language={language} loginHref={loginHref} />
      </section>
    </AuthShell>
  );
}
