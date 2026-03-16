"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { PublicTherapist } from "@/lib/users/therapists";

type Props = {
  therapist: PublicTherapist;
  labels: {
    onlineAvailable: string;
    inPersonAvailable: string;
    acceptingNewClients: string;
    targetGroups: string;
    languages: string;
    intakeNote: string;
    showMore: string;
    showLess: string;
    yearsExperienceSuffix: string;
  };
};

function truncateText(value: string, maxLength: number) {
  const normalized = value.trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}...`;
}

function availabilityChip(label: string, active: boolean) {
  return (
    <span
      className={`inline-flex w-full items-center justify-center rounded-full px-2.5 py-1 text-center text-[11px] ${
        active
          ? "bg-[#dce8d7] text-[#35523c]"
          : "bg-stone-100 text-stone-500"
      }`}
    >
      {label}
    </span>
  );
}

export default function TherapistDirectoryCard({ therapist, labels }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const summaryText = therapist.shortIntro || therapist.bio;
  const locationLine = [therapist.city, therapist.region].filter(Boolean).join(", ");
  const hasExpandedContent = Boolean(
    therapist.specializations.length > 2 ||
      therapist.methods.length > 1 ||
      therapist.targetGroups.length ||
      therapist.languages.length ||
      therapist.intakeNote ||
      therapist.website ||
      therapist.publicEmail ||
      therapist.phone ||
      (summaryText && summaryText.trim().length > 110)
  );

  return (
    <article className="rounded-[1.15rem] border border-[#ddd2c4] bg-white p-3 shadow-sm">
      <div className="flex gap-3">
        {therapist.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={therapist.avatarUrl}
            alt={therapist.displayName}
            className="h-14 w-14 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#efe4da] text-sm font-semibold text-stone-700">
            {therapist.displayName.slice(0, 1).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="min-w-0">
            <div className="min-w-0">
              <h3 className="truncate font-serif text-lg leading-tight text-stone-950">
                {therapist.displayName}
              </h3>
              {therapist.professionalTitle ? (
                <p className="mt-0.5 truncate text-xs font-medium text-stone-700">
                  {therapist.professionalTitle}
                </p>
              ) : null}
              {therapist.practiceName ? (
                <p className="mt-0.5 truncate text-[11px] text-stone-500">
                  {therapist.practiceName}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <div>{availabilityChip(labels.onlineAvailable, therapist.onlineAvailable)}</div>
            <div>{availabilityChip(labels.inPersonAvailable, therapist.inPersonAvailable)}</div>
            <div className="col-span-2">
              {availabilityChip(
                labels.acceptingNewClients,
                therapist.acceptingNewClients
              )}
            </div>
          </div>

          {(locationLine || therapist.yearsExperience) ? (
            <p className="mt-1 text-[11px] text-stone-600">
              {locationLine}
              {therapist.yearsExperience
                ? `${locationLine ? " • " : ""}${therapist.yearsExperience} ${labels.yearsExperienceSuffix}`
                : ""}
            </p>
          ) : null}

          {summaryText ? (
            <p className="mt-1.5 text-xs leading-5 text-stone-700">
              {truncateText(summaryText, 110)}
            </p>
          ) : null}

          {(therapist.specializations.length || therapist.methods.length) ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {therapist.specializations.slice(0, 2).map((entry) => (
                <span
                  key={entry}
                  className="rounded-full bg-[#f4ece4] px-2 py-1 text-[11px] text-stone-700"
                >
                  {entry}
                </span>
              ))}
              {therapist.methods.slice(0, 1).map((entry) => (
                <span
                  key={entry}
                  className="rounded-full bg-[#e9efe5] px-2 py-1 text-[11px] text-stone-700"
                >
                  {entry}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {therapist.publicEmail ? (
                <a
                  href={`mailto:${therapist.publicEmail}`}
                  className="inline-flex rounded-full border border-stone-300 px-3 py-1.5 text-xs text-stone-700"
                >
                  E-mail
                </a>
              ) : null}
              {therapist.phone ? (
                <a
                  href={`tel:${therapist.phone}`}
                  className="inline-flex rounded-full border border-stone-300 px-3 py-1.5 text-xs text-stone-700"
                >
                  Bel
                </a>
              ) : null}
            </div>
            {hasExpandedContent ? (
              <button
                type="button"
                onClick={() => setIsExpanded((current) => !current)}
                className="inline-flex items-center gap-1 rounded-full border border-stone-300 px-3 py-1.5 text-xs text-stone-700"
              >
                <span>{isExpanded ? labels.showLess : labels.showMore}</span>
                {isExpanded ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>
            ) : null}
          </div>

          {isExpanded ? (
            <div className="mt-3 space-y-3 border-t border-[#eadfce] pt-3">
              {summaryText ? (
                <p className="text-sm leading-6 text-stone-700">{summaryText}</p>
              ) : null}

              {(therapist.specializations.length || therapist.methods.length) ? (
                <div className="flex flex-wrap gap-1.5">
                  {therapist.specializations.map((entry) => (
                    <span
                      key={entry}
                      className="rounded-full bg-[#f4ece4] px-2.5 py-1 text-[11px] text-stone-700"
                    >
                      {entry}
                    </span>
                  ))}
                  {therapist.methods.map((entry) => (
                    <span
                      key={entry}
                      className="rounded-full bg-[#e9efe5] px-2.5 py-1 text-[11px] text-stone-700"
                    >
                      {entry}
                    </span>
                  ))}
                </div>
              ) : null}

              {(therapist.targetGroups.length || therapist.languages.length) ? (
                <div className="grid gap-2 text-xs text-stone-600 sm:grid-cols-2">
                  <div>
                    <span className="font-medium text-stone-800">
                      {labels.targetGroups}:
                    </span>{" "}
                    {therapist.targetGroups.join(", ") || "-"}
                  </div>
                  <div>
                    <span className="font-medium text-stone-800">
                      {labels.languages}:
                    </span>{" "}
                    {therapist.languages.join(", ") || "-"}
                  </div>
                </div>
              ) : null}

              {therapist.intakeNote ? (
                <p className="rounded-xl bg-[#f8f3ed] px-3 py-2.5 text-xs leading-5 text-stone-700">
                  <span className="font-medium text-stone-900">
                    {labels.intakeNote}:
                  </span>{" "}
                  {therapist.intakeNote}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {therapist.website ? (
                  <a
                    href={therapist.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-full bg-stone-900 px-3 py-1.5 text-xs text-white"
                  >
                    Website
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
