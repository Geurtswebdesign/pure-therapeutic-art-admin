import Link from "next/link";
import { login, verifyMfa } from "@/components/login/actions";
import AdminTwoFactorCard from "@/components/admin/settings/AdminTwoFactorCard";
import { getPrimaryLanguage } from "@/lib/i18n/getPrimaryLanguage";
import { resolveUiLanguage } from "@/lib/i18n/runtime";
import { getAppMessages } from "@/lib/i18n/appMessages";

type LoginSearchParams = {
  step?: string | string[];
  error?: string | string[];
  next?: string | string[];
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<LoginSearchParams>;
}) {
  const language = resolveUiLanguage(await getPrimaryLanguage());
  const t = getAppMessages(language).login;
  const params = await searchParams;
  const step = Array.isArray(params?.step) ? params?.step[0] : params?.step;
  const error = Array.isArray(params?.error) ? params?.error[0] : params?.error;
  const next = Array.isArray(params?.next) ? params?.next[0] : params?.next;
  const isMfaStep = step === "mfa";
  const isMfaSetup = step === "mfa-setup";
  const hasError = error === "invalid";
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {isMfaStep ? (
        <form
          action={verifyMfa}
          className="w-full max-w-sm bg-white border rounded-lg p-6 space-y-4"
        >
          <h1 className="text-xl font-semibold text-center">{t.mfaTitle}</h1>
          <p className="text-sm text-gray-600">{t.mfaPrompt}</p>
          <div>
            <label className="block text-sm mb-1">{t.mfaCode}</label>
            <input
              name="code"
              type="text"
              inputMode="numeric"
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>
          {hasError ? (
            <p className="text-sm text-red-600">{t.mfaInvalid}</p>
          ) : null}
          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded"
          >
            {t.mfaSubmit}
          </button>
        </form>
      ) : isMfaSetup ? (
        <div className="w-full max-w-2xl space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {t.mfaSetupPrompt}
          </div>
          <AdminTwoFactorCard language={language} />
          <div className="text-right">
            <Link
              href="/admin"
              className="inline-flex items-center rounded bg-black px-4 py-2 text-sm text-white"
            >
              {t.mfaSetupContinue}
            </Link>
          </div>
        </div>
      ) : (
        <form
          action={login}
          className="w-full max-w-sm bg-white border rounded-lg p-6 space-y-4"
        >
          <h1 className="text-xl font-semibold text-center">{t.title}</h1>
          <input type="hidden" name="next" value={next || "/account"} />
          <input type="hidden" name="origin" value="login" />

          <div>
            <label className="block text-sm mb-1">{t.email}</label>
            <input
              name="email"
              type="email"
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">{t.password}</label>
            <input
              name="password"
              type="password"
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded"
          >
            {t.submit}
          </button>

          {hasError ? (
            <p className="text-sm text-red-600 text-center">{t.mfaInvalid}</p>
          ) : null}
        </form>
      )}
    </div>
  );
}
