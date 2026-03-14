import Link from "next/link";
import PublicAppShell from "@/components/public/PublicAppShell";
import { getPrimaryLanguage } from "@/lib/i18n/getPrimaryLanguage";
import { resolveUiLanguage } from "@/lib/i18n/runtime";
import { getAppMessages } from "@/lib/i18n/appMessages";
import { getPublicTherapistDirectoryData } from "@/lib/users/therapists";

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

function availabilityChip(label: string, active: boolean) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs ${
        active
          ? "bg-[#dce8d7] text-[#35523c]"
          : "bg-stone-100 text-stone-500"
      }`}
    >
      {label}
    </span>
  );
}

export default async function TherapeutenPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const language = resolveUiLanguage(await getPrimaryLanguage());
  const generalT = getAppMessages(language).userGeneral;
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
          <h2 className="font-serif text-3xl text-stone-950">Vind een therapeut</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Zoek op specialisatie, methode of locatie en bekijk welke therapeuten
            momenteel zichtbaar en beschikbaar zijn.
          </p>
        </div>

        <form className="space-y-3 rounded-[1.5rem] border border-[#e2d7c9] bg-[#f6efe8] p-4 shadow-sm">
          <div>
            <label className="mb-1 block text-sm text-stone-700">Zoeken</label>
            <input
              name="q"
              defaultValue={q}
              placeholder="Bijvoorbeeld rouw, trauma of beeldend"
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
                <option value="">Alle plaatsen</option>
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
                <option value="">Alle specialisaties</option>
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
                <option value="">Alle doelgroepen</option>
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
                <option value="">Alle talen</option>
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
                <option value="">Alle methodieken</option>
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
              Filteren
            </button>
            <Link
              href="/therapeuten"
              className="inline-flex rounded-full border border-stone-300 bg-white px-4 py-2 text-sm text-stone-700"
            >
              Reset
            </Link>
          </div>
        </form>

        <div className="px-1 text-sm text-stone-500">
          {therapists.length} therapeut{therapists.length === 1 ? "" : "en"} gevonden
        </div>

        <div className="space-y-3">
          {therapists.length ? (
            therapists.map((therapist) => (
              <article
                key={therapist.userId}
                className="rounded-[1.5rem] border border-[#ddd2c4] bg-white p-4 shadow-sm"
              >
                <div className="flex gap-4">
                  {therapist.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={therapist.avatarUrl}
                      alt={therapist.displayName}
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#efe4da] text-lg font-semibold text-stone-700">
                      {therapist.displayName.slice(0, 1).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-serif text-2xl leading-tight text-stone-950">
                          {therapist.displayName}
                        </h3>
                        {therapist.professionalTitle ? (
                          <p className="mt-1 text-sm font-medium text-stone-700">
                            {therapist.professionalTitle}
                          </p>
                        ) : null}
                        {therapist.practiceName ? (
                          <p className="mt-1 text-sm text-stone-500">
                            {therapist.practiceName}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {availabilityChip(generalT.onlineAvailable, therapist.onlineAvailable)}
                        {availabilityChip(
                          generalT.inPersonAvailable,
                          therapist.inPersonAvailable
                        )}
                        {availabilityChip(
                          generalT.acceptingNewClients,
                          therapist.acceptingNewClients
                        )}
                      </div>
                    </div>

                    {(therapist.city || therapist.region || therapist.yearsExperience) ? (
                      <p className="mt-2 text-sm text-stone-600">
                        {[therapist.city, therapist.region]
                          .filter(Boolean)
                          .join(", ")}
                        {therapist.yearsExperience
                          ? `${therapist.city || therapist.region ? " • " : ""}${therapist.yearsExperience} jaar ervaring`
                          : ""}
                      </p>
                    ) : null}

                    {therapist.shortIntro || therapist.bio ? (
                      <p className="mt-3 text-sm leading-6 text-stone-700">
                        {therapist.shortIntro || therapist.bio}
                      </p>
                    ) : null}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {therapist.specializations.slice(0, 5).map((entry) => (
                        <span
                          key={entry}
                          className="rounded-full bg-[#f4ece4] px-3 py-1 text-xs text-stone-700"
                        >
                          {entry}
                        </span>
                      ))}
                      {therapist.methods.slice(0, 4).map((entry) => (
                        <span
                          key={entry}
                          className="rounded-full bg-[#e9efe5] px-3 py-1 text-xs text-stone-700"
                        >
                          {entry}
                        </span>
                      ))}
                    </div>

                    {(therapist.targetGroups.length || therapist.languages.length) ? (
                      <div className="mt-3 grid gap-2 text-sm text-stone-600 sm:grid-cols-2">
                        <div>
                          <span className="font-medium text-stone-800">
                            {generalT.targetGroups}:
                          </span>{" "}
                          {therapist.targetGroups.join(", ") || "-"}
                        </div>
                        <div>
                          <span className="font-medium text-stone-800">
                            {generalT.languages}:
                          </span>{" "}
                          {therapist.languages.join(", ") || "-"}
                        </div>
                      </div>
                    ) : null}

                    {therapist.intakeNote ? (
                      <p className="mt-3 rounded-xl bg-[#f8f3ed] px-3 py-3 text-sm leading-6 text-stone-700">
                        <span className="font-medium text-stone-900">
                          {generalT.intakeNote}:
                        </span>{" "}
                        {therapist.intakeNote}
                      </p>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {therapist.website ? (
                        <a
                          href={therapist.website}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex rounded-full bg-stone-900 px-4 py-2 text-sm text-white"
                        >
                          Website
                        </a>
                      ) : null}
                      {therapist.publicEmail ? (
                        <a
                          href={`mailto:${therapist.publicEmail}`}
                          className="inline-flex rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700"
                        >
                          E-mail
                        </a>
                      ) : null}
                      {therapist.phone ? (
                        <a
                          href={`tel:${therapist.phone}`}
                          className="inline-flex rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700"
                        >
                          Bel
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
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
