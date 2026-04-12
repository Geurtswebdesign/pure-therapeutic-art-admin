import Link from "next/link";
import PublicAppShell from "@/components/public/PublicAppShell";
import TherapistDirectoryCard from "@/components/public/TherapistDirectoryCard";
import { getAppLanguage } from "@/lib/i18n/getAppLanguage";
import { resolveUiLanguage } from "@/lib/i18n/runtime";
import { getAppMessages } from "@/lib/i18n/appMessages";
import { getPublicAppMessages } from "@/lib/i18n/publicAppMessages";
import { getPublicTherapistDirectoryData } from "@/lib/users/therapists";

export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string | string[];
  city?: string | string[];
  specialization?: string | string[];
  targetGroup?: string | string[];
  language?: string | string[];
  method?: string | string[];
  online?: string | string[];
  inPerson?: string | string[];
  accepting?: string | string[];
};

function getParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function TherapeutenPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const language = resolveUiLanguage(await getAppLanguage());
  const generalT = getAppMessages(language).userGeneral;
  const t = getPublicAppMessages(language).therapists;
  const params = await searchParams;
  const q = getParam(params?.q);
  const city = getParam(params?.city);
  const specialization = getParam(params?.specialization);
  const targetGroup = getParam(params?.targetGroup);
  const directoryLanguage = getParam(params?.language);
  const method = getParam(params?.method);
  const online = getParam(params?.online) === "1";
  const inPerson = getParam(params?.inPerson) === "1";
  const accepting = getParam(params?.accepting) === "1";

  const {
    therapists,
    cities,
    specializations,
    targetGroups,
    languages,
    methods,
  } =
    await getPublicTherapistDirectoryData({
      q,
      city,
      specialization,
      targetGroup,
      language: directoryLanguage,
      method,
      onlineOnly: online,
      inPersonOnly: inPerson,
      acceptingOnly: accepting,
    });

  return (
    <PublicAppShell activeTab="therapeuten">
      <section className="space-y-4">
        <div className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="font-serif text-3xl text-stone-950">{t.title}</h2>
        </div>

        <form className="space-y-3 rounded-[1.5rem] border border-[#e2d7c9] bg-[#f6efe8] p-4 shadow-sm">
          <div>
            <label className="mb-1 block text-sm text-stone-700">{t.searchLabel}</label>
            <input
              name="q"
              defaultValue={q}
              placeholder={t.searchPlaceholder}
              className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="space-y-1">
              <span className="block text-sm text-stone-700">{generalT.city}</span>
              <select
                name="city"
                defaultValue={city}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
              >
                <option value="">{t.allCities}</option>
                {cities.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="block text-sm text-stone-700">
                {generalT.specializations}
              </span>
              <select
                name="specialization"
                defaultValue={specialization}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
              >
                <option value="">{t.allSpecializations}</option>
                {specializations.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="block text-sm text-stone-700">
                {generalT.targetGroups}
              </span>
              <select
                name="targetGroup"
                defaultValue={targetGroup}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
              >
                <option value="">{t.allTargetGroups}</option>
                {targetGroups.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="block text-sm text-stone-700">{generalT.languages}</span>
              <select
                name="language"
                defaultValue={directoryLanguage}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
              >
                <option value="">{t.allLanguages}</option>
                {languages.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="block text-sm text-stone-700">{generalT.methods}</span>
              <select
                name="method"
                defaultValue={method}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
              >
                <option value="">{t.allMethods}</option>
                {methods.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-stone-700">
              <input
                type="checkbox"
                name="online"
                value="1"
                defaultChecked={online}
                className="h-4 w-4 rounded border-stone-300"
              />
              {generalT.onlineAvailable}
            </label>

            <label className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-stone-700">
              <input
                type="checkbox"
                name="inPerson"
                value="1"
                defaultChecked={inPerson}
                className="h-4 w-4 rounded border-stone-300"
              />
              {generalT.inPersonAvailable}
            </label>

            <label className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-stone-700">
              <input
                type="checkbox"
                name="accepting"
                value="1"
                defaultChecked={accepting}
                className="h-4 w-4 rounded border-stone-300"
              />
              {generalT.acceptingNewClients}
            </label>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="inline-flex rounded-full bg-stone-900 px-4 py-2 text-sm text-white"
            >
              {t.filter}
            </button>
            <Link
              href="/therapeuten"
              className="inline-flex rounded-full border border-stone-300 bg-white px-4 py-2 text-sm text-stone-700"
            >
              {t.reset}
            </Link>
          </div>
        </form>

        <div className="px-1 text-sm text-stone-500">
          {therapists.length}{" "}
          {therapists.length === 1 ? t.resultSingular : t.resultPlural}
        </div>

        <div className="space-y-3">
          {therapists.length ? (
            therapists.map((therapist) => (
              <TherapistDirectoryCard
                key={therapist.userId}
                therapist={therapist}
                labels={{
                  onlineAvailable: generalT.onlineAvailable,
                  inPersonAvailable: generalT.inPersonAvailable,
                  acceptingNewClients: generalT.acceptingNewClients,
                  targetGroups: generalT.targetGroups,
                  languages: generalT.languages,
                  intakeNote: generalT.intakeNote,
                  email: t.email,
                  call: t.call,
                  website: t.website,
                  showMore: t.showMore,
                  showLess: t.showLess,
                  yearsExperienceSuffix: t.yearsExperienceSuffix,
                }}
              />
            ))
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-stone-300 bg-white p-6 text-center text-sm leading-6 text-stone-500">
              Er zijn nog geen zichtbare therapeuten gevonden met deze filters.
            </div>
          )}
        </div>
      </section>
    </PublicAppShell>
  );
}
