import Link from "next/link";
import { login, registerAccount, verifyMfa } from "@/components/login/actions";
import AdminTwoFactorCard from "@/components/admin/settings/AdminTwoFactorCard";
import { getPrimaryLanguage } from "@/lib/i18n/getPrimaryLanguage";
import { resolveUiLanguage } from "@/lib/i18n/runtime";
import { getAppMessages } from "@/lib/i18n/appMessages";

type LoginSearchParams = {
  step?: string | string[];
  error?: string | string[];
  next?: string | string[];
  mode?: string | string[];
  registered?: string | string[];
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
  const mode = Array.isArray(params?.mode) ? params?.mode[0] : params?.mode;
  const registered = Array.isArray(params?.registered)
    ? params?.registered[0]
    : params?.registered;
  const isMfaStep = step === "mfa";
  const isMfaSetup = step === "mfa-setup";
  const hasMfaError = error === "invalid";
  const isRegisterMode = mode === "register";
  const hasLoginError = error === "invalid";
  const hasRegisterError = error === "register";
  const registrationSucceeded = registered === "1";
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";
  const registerHref = next
    ? `/login?mode=register&next=${encodeURIComponent(next)}`
    : "/login?mode=register";
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
          {hasMfaError ? (
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
        <div className="w-full max-w-sm bg-white border rounded-lg p-6 space-y-4">
          <div className="flex gap-2">
            <Link
              href={loginHref}
              className={`flex-1 rounded-full px-4 py-2 text-center text-sm ${
                isRegisterMode
                  ? "border border-stone-300 text-stone-700"
                  : "bg-black text-white"
              }`}
            >
              {t.modeLogin}
            </Link>
            <Link
              href={registerHref}
              className={`flex-1 rounded-full px-4 py-2 text-center text-sm ${
                isRegisterMode
                  ? "bg-black text-white"
                  : "border border-stone-300 text-stone-700"
              }`}
            >
              {t.modeRegister}
            </Link>
          </div>

          {registrationSucceeded ? (
            <p className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {t.registerSuccess}
            </p>
          ) : null}

          {isRegisterMode ? (
            <form action={registerAccount} className="space-y-4">
              <h1 className="text-xl font-semibold text-center">{t.registerTitle}</h1>
              <input type="hidden" name="next" value={next || "/account"} />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm mb-1">{t.firstName}</label>
                  <input
                    name="first_name"
                    type="text"
                    required
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">{t.lastName}</label>
                  <input
                    name="last_name"
                    type="text"
                    required
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>

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
                  minLength={8}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">{t.accountType}</label>
                <select
                  name="account_type"
                  defaultValue="client"
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="client">{t.accountTypeClient}</option>
                  <option value="therapist">{t.accountTypeTherapist}</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-black text-white py-2 rounded"
              >
                {t.registerSubmit}
              </button>

              {hasRegisterError ? (
                <p className="text-sm text-red-600 text-center">{t.registerFailed}</p>
              ) : null}
            </form>
          ) : (
            <form action={login} className="space-y-4">
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

              {hasLoginError ? (
                <p className="text-sm text-red-600 text-center">{t.mfaInvalid}</p>
              ) : null}
            </form>
          )}
        </div>
      )}
    </div>
  );
}
