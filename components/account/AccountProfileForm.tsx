"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateMyProfile } from "@/app/account/actions";
import MultiSelectDropdown from "@/components/forms/MultiSelectDropdown";
import { uploadMediaAssetClient } from "@/lib/content/uploadClient";
import { getAppMessages } from "@/lib/i18n/appMessages";
import { resolveBaseUiLanguage, type UiLanguage } from "@/lib/i18n/runtime";
import {
  type TherapistProfileData,
  type UserAccountType,
} from "@/lib/users/accountTypes";
import { THERAPIST_PROFILE_OPTION_SETS } from "@/lib/users/therapistProfileOptions";

type Props = {
  userId: string;
  accountType: UserAccountType;
  hasTherapistDirectoryAccess: boolean;
  initialDisplayName: string;
  initialBio: string;
  initialFirstName: string;
  initialLastName: string;
  initialWebsite: string;
  initialAvatarUrl: string;
  initialTherapistProfile: TherapistProfileData | null;
  email: string;
  language: UiLanguage;
};

export default function AccountProfileForm({
  userId,
  accountType,
  hasTherapistDirectoryAccess,
  initialDisplayName,
  initialBio,
  initialFirstName,
  initialLastName,
  initialWebsite,
  initialAvatarUrl,
  initialTherapistProfile,
  email,
  language,
}: Props) {
  const router = useRouter();
  const messages = getAppMessages(language);
  const t = messages.accountProfile;
  const general = messages.userGeneral;
  const therapist = initialTherapistProfile;
  const baseLanguage = resolveBaseUiLanguage(language);
  const directoryAccessCopy = {
    nl: {
      description:
        "Je gratis therapeut-account blijft verborgen in de therapeutenlijst. Neem in de shop eerst een therapeut-abonnement als je dit profiel zichtbaar wilt kunnen maken.",
      cta: "Bekijk therapeut-abonnementen",
    },
    en: {
      description:
        "Your free therapist account stays hidden from the therapist directory. Take a therapist subscription in the shop first if you want to make this profile visible.",
      cta: "View therapist subscriptions",
    },
    de: {
      description:
        "Dein kostenloses Therapeutenkonto bleibt im Therapeutenverzeichnis verborgen. Schliesse zuerst im Shop ein Therapeuten-Abo ab, wenn du dieses Profil sichtbar machen moechtest.",
      cta: "Therapeuten-Abos ansehen",
    },
  }[baseLanguage];
  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [website, setWebsite] = useState(initialWebsite);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const bio = initialBio;
  const [publicDirectory, setPublicDirectory] = useState(
    hasTherapistDirectoryAccess
      ? therapist?.public_profile_enabled ?? false
      : false
  );
  const [professionalTitle, setProfessionalTitle] = useState(
    therapist?.professional_title ?? ""
  );
  const [shortIntro, setShortIntro] = useState(therapist?.short_intro ?? "");
  const [practiceName, setPracticeName] = useState(
    therapist?.practice_name ?? ""
  );
  const [registrationNumber, setRegistrationNumber] = useState(
    therapist?.registration_number ?? ""
  );
  const [publicEmail, setPublicEmail] = useState(therapist?.public_email ?? "");
  const [phone, setPhone] = useState(therapist?.phone ?? "");
  const [city, setCity] = useState(therapist?.city ?? "");
  const [region, setRegion] = useState(therapist?.region ?? "");
  const [location, setLocation] = useState(therapist?.location ?? "");
  const [onlineAvailable, setOnlineAvailable] = useState(
    therapist?.online_available ?? false
  );
  const [inPersonAvailable, setInPersonAvailable] = useState(
    therapist?.in_person_available ?? false
  );
  const [acceptingNewClients, setAcceptingNewClients] = useState(
    therapist?.accepting_new_clients ?? false
  );
  const [specializations, setSpecializations] = useState(
    therapist?.specializations ?? []
  );
  const [targetGroups, setTargetGroups] = useState(
    therapist?.target_groups ?? []
  );
  const [languages, setLanguages] = useState(
    therapist?.languages ?? []
  );
  const [methods, setMethods] = useState(
    therapist?.methods ?? []
  );
  const [yearsExperience, setYearsExperience] = useState(
    therapist?.years_experience?.toString() ?? ""
  );
  const [intakeNote, setIntakeNote] = useState(therapist?.intake_note ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toNullableNumber(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  async function handleAvatarChange(file: File | null) {
    if (!file) return;

    setMessage(null);
    setUploadError(null);
    setIsUploadingAvatar(true);

    try {
      const url = await uploadMediaAssetClient(file, `profiles/${userId}`);
      setAvatarUrl(url);
      setMessage(t.avatarUploaded);
    } catch {
      setUploadError(t.avatarUploadFailed);
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  function onCancel() {
    setFirstName(initialFirstName);
    setLastName(initialLastName);
    setDisplayName(initialDisplayName);
    setWebsite(initialWebsite);
    setAvatarUrl(initialAvatarUrl);
    setPublicDirectory(
      hasTherapistDirectoryAccess
        ? therapist?.public_profile_enabled ?? false
        : false
    );
    setProfessionalTitle(therapist?.professional_title ?? "");
    setShortIntro(therapist?.short_intro ?? "");
    setPracticeName(therapist?.practice_name ?? "");
    setRegistrationNumber(therapist?.registration_number ?? "");
    setPublicEmail(therapist?.public_email ?? "");
    setPhone(therapist?.phone ?? "");
    setCity(therapist?.city ?? "");
    setRegion(therapist?.region ?? "");
    setLocation(therapist?.location ?? "");
    setOnlineAvailable(therapist?.online_available ?? false);
    setInPersonAvailable(therapist?.in_person_available ?? false);
    setAcceptingNewClients(therapist?.accepting_new_clients ?? false);
    setSpecializations(therapist?.specializations ?? []);
    setTargetGroups(therapist?.target_groups ?? []);
    setLanguages(therapist?.languages ?? []);
    setMethods(therapist?.methods ?? []);
    setYearsExperience(therapist?.years_experience?.toString() ?? "");
    setIntakeNote(therapist?.intake_note ?? "");
    setMessage(null);
    setUploadError(null);
    router.push("/account");
  }

  function onSave() {
    setMessage(null);
    setUploadError(null);
    startTransition(async () => {
      try {
        await updateMyProfile({
          firstName,
          lastName,
          displayName,
          website,
          avatarUrl,
          bio,
          accountType,
          therapistProfile:
            accountType === "therapist"
              ? {
                  public_profile_enabled: hasTherapistDirectoryAccess
                    ? publicDirectory
                    : false,
                  professional_title: professionalTitle,
                  short_intro: shortIntro,
                  practice_name: practiceName,
                  registration_number: registrationNumber,
                  public_email: publicEmail,
                  phone,
                  city,
                  region,
                  location,
                  online_available: onlineAvailable,
                  in_person_available: inPersonAvailable,
                  accepting_new_clients: acceptingNewClients,
                  specializations,
                  target_groups: targetGroups,
                  languages,
                  methods,
                  years_experience: toNullableNumber(yearsExperience),
                  intake_note: intakeNote,
                }
              : null,
        });
        setMessage(t.saved);
      } catch (e) {
        const text = e instanceof Error ? e.message : t.saveFailed;
        setMessage(text);
      }
    });
  }

  return (
    <section className="space-y-4 rounded-2xl border border-[#e5dbcf] bg-[#f7f0e9] p-4">
      <h2 className="text-lg font-semibold text-stone-900">{t.title}</h2>

      <label className="block space-y-1">
        <span className="text-sm text-stone-600">{t.email}</span>
        <input
          value={email}
          disabled
          className="w-full rounded-xl border border-stone-200 bg-white/70 px-3 py-2 text-sm text-stone-700"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm text-stone-600">{t.avatar}</span>
      </label>
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-4">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName || email}
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-stone-100 text-sm text-stone-500">
              {t.avatarEmpty}
            </div>
          )}

          <div className="space-y-2">
            <label className="inline-flex cursor-pointer rounded-full bg-[#b64040] px-4 py-2 text-sm text-white">
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={isUploadingAvatar}
                onChange={(event) => {
                  void handleAvatarChange(event.target.files?.[0] ?? null);
                  event.currentTarget.value = "";
                }}
              />
              {isUploadingAvatar ? t.avatarUploading : t.avatarUpload}
            </label>
            {avatarUrl ? (
              <button
                type="button"
                onClick={() => setAvatarUrl("")}
                className="block rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700"
              >
                {t.avatarRemove}
              </button>
            ) : null}
            <p className="text-xs leading-5 text-stone-500">{t.avatarHint}</p>
            {uploadError ? (
              <p className="text-sm text-red-600">{uploadError}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-sm text-stone-600">{general.firstName}</span>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-stone-600">{general.lastName}</span>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
          />
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-sm text-stone-600">{t.displayName}</span>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm text-stone-600">{general.website}</span>
        <input
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://"
          className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
        />
      </label>

      {accountType === "therapist" ? (
        <div className="space-y-4 rounded-2xl border border-[#decfbe] bg-white/70 p-4">
          <div>
            <h3 className="text-base font-semibold text-stone-900">
              {general.therapistDetails}
            </h3>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              {hasTherapistDirectoryAccess
                ? general.publicDirectoryHint
                : directoryAccessCopy.description}
            </p>
          </div>

          {hasTherapistDirectoryAccess ? (
            <label className="flex items-start gap-3 rounded-xl border border-stone-200 bg-white px-3 py-3">
              <input
                type="checkbox"
                checked={publicDirectory}
                onChange={(e) => setPublicDirectory(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-stone-300"
              />
              <span className="text-sm text-stone-700">
                {general.publicDirectory}
              </span>
            </label>
          ) : (
            <div className="rounded-xl border border-[#eadfce] bg-[#fcf6f1] px-4 py-3">
              <Link
                href="/shop/credits#therapeut-abonnement"
                className="inline-flex items-center rounded-full border border-[#d8c7b8] bg-white px-3 py-1.5 text-xs font-medium text-[#8a5f49] transition hover:bg-[#fffaf6]"
              >
                {directoryAccessCopy.cta}
              </Link>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-sm text-stone-600">{general.professionalTitle}</span>
              <input
                value={professionalTitle}
                onChange={(e) => setProfessionalTitle(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm text-stone-600">{general.practiceName}</span>
              <input
                value={practiceName}
                onChange={(e) => setPracticeName(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-sm text-stone-600">{general.shortIntro}</span>
            <textarea
              rows={3}
              value={shortIntro}
              onChange={(e) => setShortIntro(e.target.value)}
              className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-sm text-stone-600">{general.publicEmail}</span>
              <input
                type="email"
                value={publicEmail}
                onChange={(e) => setPublicEmail(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm text-stone-600">{general.phone}</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block space-y-1">
              <span className="text-sm text-stone-600">{general.city}</span>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm text-stone-600">{general.region}</span>
              <input
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm text-stone-600">{general.yearsExperience}</span>
              <input
                type="number"
                min="0"
                value={yearsExperience}
                onChange={(e) => setYearsExperience(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-sm text-stone-600">{general.location}</span>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm text-stone-600">{general.registrationNumber}</span>
              <input
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={onlineAvailable}
                onChange={(e) => setOnlineAvailable(e.target.checked)}
                className="h-4 w-4 rounded border-stone-300"
              />
              {general.onlineAvailable}
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={inPersonAvailable}
                onChange={(e) => setInPersonAvailable(e.target.checked)}
                className="h-4 w-4 rounded border-stone-300"
              />
              {general.inPersonAvailable}
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={acceptingNewClients}
                onChange={(e) => setAcceptingNewClients(e.target.checked)}
                className="h-4 w-4 rounded border-stone-300"
              />
              {general.acceptingNewClients}
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-sm text-stone-600">{general.specializations}</span>
            <MultiSelectDropdown
              label={general.specializations}
              options={THERAPIST_PROFILE_OPTION_SETS.specializations}
              selectedValues={specializations}
              onChange={setSpecializations}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-sm text-stone-600">{general.targetGroups}</span>
              <MultiSelectDropdown
                label={general.targetGroups}
                options={THERAPIST_PROFILE_OPTION_SETS.targetGroups}
                selectedValues={targetGroups}
                onChange={setTargetGroups}
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm text-stone-600">{general.languages}</span>
              <MultiSelectDropdown
                label={general.languages}
                options={THERAPIST_PROFILE_OPTION_SETS.languages}
                selectedValues={languages}
                onChange={setLanguages}
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-sm text-stone-600">{general.methods}</span>
            <MultiSelectDropdown
              label={general.methods}
              options={THERAPIST_PROFILE_OPTION_SETS.methods}
              selectedValues={methods}
              onChange={setMethods}
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm text-stone-600">{general.intakeNote}</span>
            <textarea
              rows={4}
              value={intakeNote}
              onChange={(e) => setIntakeNote(e.target.value)}
              className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900"
            />
          </label>
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={isPending || isUploadingAvatar}
          className="rounded-full bg-[#b64040] px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {isPending ? t.saving : t.save}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={isPending || isUploadingAvatar}
          className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm text-stone-700 disabled:opacity-60"
        >
          {t.cancel}
        </button>

        {message ? <p className="text-sm text-stone-600">{message}</p> : null}
      </div>
    </section>
  );
}
