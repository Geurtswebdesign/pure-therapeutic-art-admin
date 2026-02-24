import CreateUserForm from "./CreateUserForm";
import { getPrimaryLanguage } from "@/lib/i18n/getPrimaryLanguage";
import { resolveUiLanguage } from "@/lib/i18n/runtime";
import { getAdminMessages } from "@/lib/i18n/adminMessages";

export default async function NewUserPage() {
  const language = resolveUiLanguage(await getPrimaryLanguage());
  const t = getAdminMessages(language).createUserPage;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold mb-6">{t.title}</h1>
      <CreateUserForm language={language} />
    </div>
  );
}
