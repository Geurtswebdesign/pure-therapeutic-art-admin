"use client";

import { useState } from "react";
import AdminResetPasswordButton from "@/components/admin/AdminResetPasswordButton";
import MultiSelectDropdown from "@/components/forms/MultiSelectDropdown";
import AdminRoleEditor from "@/lib/admin/AdminRoleEditor";
import { updateUserProfileExtended } from "@/app/admin/users/actions";
import { getAppMessages } from "@/lib/i18n/appMessages";
import type { UiLanguage } from "@/lib/i18n/runtime";
import {
  getProfileAccountType,
  getTherapistProfileData,
} from "@/lib/users/accountTypes";
import { THERAPIST_PROFILE_OPTION_SETS } from "@/lib/users/therapistProfileOptions";

import type { AdminUserProfile } from "@/lib/users/getUserDetail";

type Props = {
  user: AdminUserProfile;
  language: UiLanguage;
};

export default function UserGeneralTab({ user, language }: Props) {
  const t = getAppMessages(language).userGeneral;
  const profileData = user.profile_data ?? {};
  const therapistProfile = getTherapistProfileData(profileData);

  const [firstName, setFirstName] = useState(
    profileData.first_name ?? ""
  );
  const [lastName, setLastName] = useState(
    profileData.last_name ?? ""
  );
  const [nickname, setNickname] = useState(
    profileData.nickname ?? ""
  );
  const [website, setWebsite] = useState(
    profileData.website ?? ""
  );
  const [bio, setBio] = useState(profileData.bio ?? "");
  const [accountType, setAccountType] = useState(
    getProfileAccountType(profileData)
  );
  const [practiceName, setPracticeName] = useState(
    therapistProfile.practice_name ?? ""
  );
  const [publicDirectory, setPublicDirectory] = useState(
    therapistProfile.public_profile_enabled ?? false
  );
  const [professionalTitle, setProfessionalTitle] = useState(
    therapistProfile.professional_title ?? ""
  );
  const [shortIntro, setShortIntro] = useState(
    therapistProfile.short_intro ?? ""
  );
  const [registrationNumber, setRegistrationNumber] = useState(
    therapistProfile.registration_number ?? ""
  );
  const [publicEmail, setPublicEmail] = useState(
    therapistProfile.public_email ?? ""
  );
  const [phone, setPhone] = useState(therapistProfile.phone ?? "");
  const [city, setCity] = useState(therapistProfile.city ?? "");
  const [region, setRegion] = useState(therapistProfile.region ?? "");
  const [location, setLocation] = useState(therapistProfile.location ?? "");
  const [onlineAvailable, setOnlineAvailable] = useState(
    therapistProfile.online_available ?? false
  );
  const [inPersonAvailable, setInPersonAvailable] = useState(
    therapistProfile.in_person_available ?? false
  );
  const [acceptingNewClients, setAcceptingNewClients] = useState(
    therapistProfile.accepting_new_clients ?? false
  );
  const [specializations, setSpecializations] = useState(
    therapistProfile.specializations ?? []
  );
  const [targetGroups, setTargetGroups] = useState(
    therapistProfile.target_groups ?? []
  );
  const [languages, setLanguages] = useState(
    therapistProfile.languages ?? []
  );
  const [methods, setMethods] = useState(
    therapistProfile.methods ?? []
  );
  const [yearsExperience, setYearsExperience] = useState(
    therapistProfile.years_experience?.toString() ?? ""
  );
  const [intakeNote, setIntakeNote] = useState(
    therapistProfile.intake_note ?? ""
  );

  const [displayName, setDisplayName] = useState(
    user.display_name ?? ""
  );

  const [saving, setSaving] = useState(false);

  const initialRole =
    user.role === "admin" ? "admin" : "user";

  async function handleSave() {
    setSaving(true);

    try {
      await updateUserProfileExtended({
        userId: user.user_id,
        display_name: displayName || null,
        profileData: {
          first_name: firstName,
          last_name: lastName,
          nickname,
          website,
          bio,
          account_type: accountType,
          therapist_profile:
            accountType === "therapist"
              ? {
                  public_profile_enabled: publicDirectory,
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
                  years_experience: yearsExperience,
                  intake_note: intakeNote,
                }
              : null,
        },
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-10">

      {/* NAAM */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">{t.name}</h2>

        <div className="grid max-w-md gap-3">
          <input
            placeholder={t.firstName}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="rounded border px-2 py-1"
          />
          <input
            placeholder={t.lastName}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="rounded border px-2 py-1"
          />
          <input
            placeholder={t.nickname}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="rounded border px-2 py-1"
          />

          <input
            placeholder={t.displayName}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="rounded border px-2 py-1"
          />

          <select
            value={accountType}
            onChange={(e) => {
              const nextType = e.target.value;
              if (
                nextType === "user" ||
                nextType === "client" ||
                nextType === "therapist"
              ) {
                setAccountType(nextType);
              }
            }}
            className="rounded border px-2 py-1"
            disabled={user.role === "admin"}
          >
            <option value="user">{t.accountTypeUser}</option>
            <option value="client">{t.accountTypeClient}</option>
            <option value="therapist">{t.accountTypeTherapist}</option>
          </select>
        </div>
      </section>

      {/* CONTACT */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">
          {t.contactInfo}
        </h2>

        <input
          placeholder={t.website}
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="rounded border px-2 py-1 max-w-md"
        />
      </section>

      {/* OVER JEZELF */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">
          {t.aboutYou}
        </h2>

        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="rounded border px-2 py-1 w-full max-w-xl"
          rows={4}
        />
      </section>

      {accountType === "therapist" ? (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">
            {t.therapistDetails}
          </h2>

          <div className="grid max-w-xl gap-3">
            <label className="flex items-start gap-3 rounded border px-3 py-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={publicDirectory}
                onChange={(e) => setPublicDirectory(e.target.checked)}
                className="mt-1"
              />
              <span>{t.publicDirectory}</span>
            </label>
            <input
              placeholder={t.professionalTitle}
              value={professionalTitle}
              onChange={(e) => setProfessionalTitle(e.target.value)}
              className="rounded border px-2 py-1"
            />
            <textarea
              placeholder={t.shortIntro}
              value={shortIntro}
              onChange={(e) => setShortIntro(e.target.value)}
              className="rounded border px-2 py-1"
              rows={3}
            />
            <input
              placeholder={t.practiceName}
              value={practiceName}
              onChange={(e) => setPracticeName(e.target.value)}
              className="rounded border px-2 py-1"
            />
            <input
              placeholder={t.registrationNumber}
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              className="rounded border px-2 py-1"
            />
            <input
              placeholder={t.publicEmail}
              value={publicEmail}
              onChange={(e) => setPublicEmail(e.target.value)}
              className="rounded border px-2 py-1"
              type="email"
            />
            <input
              placeholder={t.phone}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded border px-2 py-1"
            />
            <input
              placeholder={t.city}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded border px-2 py-1"
            />
            <input
              placeholder={t.region}
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="rounded border px-2 py-1"
            />
            <input
              placeholder={t.location}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="rounded border px-2 py-1"
            />
            <input
              placeholder={t.yearsExperience}
              value={yearsExperience}
              onChange={(e) => setYearsExperience(e.target.value)}
              className="rounded border px-2 py-1"
              type="number"
              min="0"
            />
            <label className="flex items-center gap-3 rounded border px-3 py-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={onlineAvailable}
                onChange={(e) => setOnlineAvailable(e.target.checked)}
              />
              <span>{t.onlineAvailable}</span>
            </label>
            <label className="flex items-center gap-3 rounded border px-3 py-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={inPersonAvailable}
                onChange={(e) => setInPersonAvailable(e.target.checked)}
              />
              <span>{t.inPersonAvailable}</span>
            </label>
            <label className="flex items-center gap-3 rounded border px-3 py-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={acceptingNewClients}
                onChange={(e) => setAcceptingNewClients(e.target.checked)}
              />
              <span>{t.acceptingNewClients}</span>
            </label>
            <MultiSelectDropdown
              label={t.specializations}
              options={THERAPIST_PROFILE_OPTION_SETS.specializations}
              selectedValues={specializations}
              onChange={setSpecializations}
            />
            <MultiSelectDropdown
              label={t.targetGroups}
              options={THERAPIST_PROFILE_OPTION_SETS.targetGroups}
              selectedValues={targetGroups}
              onChange={setTargetGroups}
            />
            <MultiSelectDropdown
              label={t.languages}
              options={THERAPIST_PROFILE_OPTION_SETS.languages}
              selectedValues={languages}
              onChange={setLanguages}
            />
            <MultiSelectDropdown
              label={t.methods}
              options={THERAPIST_PROFILE_OPTION_SETS.methods}
              selectedValues={methods}
              onChange={setMethods}
            />
            <textarea
              placeholder={t.intakeNote}
              value={intakeNote}
              onChange={(e) => setIntakeNote(e.target.value)}
              className="rounded border px-2 py-1"
              rows={3}
            />
          </div>
        </section>
      ) : null}

      {/* OPSLAAN */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {saving ? t.saving : t.saveChanges}
      </button>

      {/* ACCOUNT */}
      <section className="space-y-4 border-t pt-6">
        <h2 className="text-sm font-semibold text-gray-700">
          {t.accountSecurity}
        </h2>

        <AdminRoleEditor
          userId={user.user_id}
          initialRole={initialRole}
          language={language}
        />

        <AdminResetPasswordButton userId={user.user_id} language={language} />
      </section>
    </div>
  );
}
