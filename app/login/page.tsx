import { login } from "@/components/login/actions";
import { getPrimaryLanguage } from "@/lib/i18n/getPrimaryLanguage";
import { resolveUiLanguage } from "@/lib/i18n/runtime";
import { getAppMessages } from "@/lib/i18n/appMessages";

export default async function LoginPage() {
  const t = getAppMessages(resolveUiLanguage(await getPrimaryLanguage())).login;
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        action={login}
        className="w-full max-w-sm bg-white border rounded-lg p-6 space-y-4"
      >
        <h1 className="text-xl font-semibold text-center">{t.title}</h1>

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
      </form>
    </div>
  );
}
