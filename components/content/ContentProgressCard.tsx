"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  saveContentNote,
  setContentProgressStatus,
  touchContentLastViewed,
} from "@/app/content/progress-actions";
import type {
  ContentProgressSnapshot,
  ContentProgressStatus,
} from "@/lib/content/progress-types";
import type { UiLanguage } from "@/lib/i18n/runtime";

const messagesByLanguage = {
  nl: {
    title: "Mijn voortgang",
    subtitle:
      "Je voortgang wordt automatisch bijgehouden zodra je begint met lezen. Je kunt dit hieronder altijd zelf aanpassen.",
    statusLabel: "Status",
    notStarted: "Nog niet gestart",
    inProgress: "Bezig",
    completed: "Afgerond",
    noteLabel: "Persoonlijke notitie",
    notePlaceholder: "Schrijf hier een korte reflectie of herinnering voor jezelf...",
    saveNote: "Notitie opslaan",
    saving: "Opslaan...",
    progressSaved: "Voortgang opgeslagen.",
    noteSaved: "Notitie opgeslagen.",
    saveFailed: "Opslaan van je voortgang is mislukt.",
  },
  en: {
    title: "My progress",
    subtitle:
      "Your progress is tracked automatically once you start reading. You can always adjust it below.",
    statusLabel: "Status",
    notStarted: "Not started",
    inProgress: "In progress",
    completed: "Completed",
    noteLabel: "Personal note",
    notePlaceholder: "Write a short reflection or reminder for yourself...",
    saveNote: "Save note",
    saving: "Saving...",
    progressSaved: "Progress saved.",
    noteSaved: "Note saved.",
    saveFailed: "Saving your progress failed.",
  },
  de: {
    title: "Mein Fortschritt",
    subtitle:
      "Dein Fortschritt wird automatisch erfasst, sobald du mit dem Lesen beginnst. Unten kannst du ihn jederzeit selbst anpassen.",
    statusLabel: "Status",
    notStarted: "Noch nicht begonnen",
    inProgress: "In Bearbeitung",
    completed: "Abgeschlossen",
    noteLabel: "Personliche Notiz",
    notePlaceholder: "Schreibe hier eine kurze Reflexion oder Erinnerung fur dich selbst...",
    saveNote: "Notiz speichern",
    saving: "Speichern...",
    progressSaved: "Fortschritt gespeichert.",
    noteSaved: "Notiz gespeichert.",
    saveFailed: "Dein Fortschritt konnte nicht gespeichert werden.",
  },
} as const;

function getStatusButtonClassName(
  currentStatus: ContentProgressStatus,
  value: ContentProgressStatus
) {
  return currentStatus === value
    ? "rounded-full border border-[#b64040] bg-[#b64040] px-3 py-1.5 text-xs font-medium text-white"
    : "rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700";
}

export default function ContentProgressCard({
  contentItemId,
  initialProgress,
  language,
}: {
  contentItemId: string;
  initialProgress: ContentProgressSnapshot;
  language: UiLanguage;
}) {
  const router = useRouter();
  const cardRef = useRef<HTMLElement | null>(null);
  const openedAtRef = useRef(Date.now());
  const touchedRef = useRef(false);
  const autoStartedRef = useRef(false);
  const [progress, setProgress] = useState(initialProgress);
  const [noteText, setNoteText] = useState(initialProgress.noteText);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const t = messagesByLanguage[language] ?? messagesByLanguage.nl;

  const noteDirty = useMemo(
    () => noteText.trim() !== progress.noteText.trim(),
    [noteText, progress.noteText]
  );

  useEffect(() => {
    if (touchedRef.current) return;
    touchedRef.current = true;

    void touchContentLastViewed(contentItemId).catch(() => {
      touchedRef.current = true;
    });
  }, [contentItemId]);

  useEffect(() => {
    if (progress.progressStatus !== "not_started") return;

    let cancelled = false;

    const markInProgress = async () => {
      if (cancelled || autoStartedRef.current) return;

      autoStartedRef.current = true;

      try {
        const next = await setContentProgressStatus(contentItemId, "in_progress");
        if (cancelled) return;
        setProgress(next);
        setNoteText(next.noteText);
      } catch {
        autoStartedRef.current = false;
      }
    };

    const maybeAutoStart = () => {
      const elapsed = Date.now() - openedAtRef.current;
      if (elapsed >= 8000) {
        void markInProgress();
        return;
      }

      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;

      if (ratio >= 0.2) {
        void markInProgress();
      }
    };

    const timer = window.setTimeout(() => {
      void markInProgress();
    }, 8000);

    window.addEventListener("scroll", maybeAutoStart, { passive: true });

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener("scroll", maybeAutoStart);
    };
  }, [contentItemId, progress.progressStatus]);

  function handleStatusChange(status: ContentProgressStatus) {
    if (status === progress.progressStatus) return;

    setMessage(null);
    startTransition(async () => {
      try {
        const next = await setContentProgressStatus(contentItemId, status);
        setProgress(next);
        setNoteText(next.noteText);
        setMessage(t.progressSaved);
        router.refresh();
      } catch {
        setMessage(t.saveFailed);
      }
    });
  }

  function handleNoteSave() {
    setMessage(null);
    startTransition(async () => {
      try {
        const next = await saveContentNote(contentItemId, noteText);
        setProgress(next);
        setNoteText(next.noteText);
        setMessage(t.noteSaved);
        router.refresh();
      } catch {
        setMessage(t.saveFailed);
      }
    });
  }

  return (
    <section
      ref={cardRef}
      className="rounded-[1.25rem] border border-[#ddcfbf] bg-white/80 p-4 sm:p-5"
    >
      <div className="text-[11px] uppercase tracking-[0.24em] text-stone-500">
        {t.title}
      </div>
      <p className="mt-2 text-sm leading-6 text-stone-600">{t.subtitle}</p>

      <div className="mt-4">
        <div className="mb-2 text-sm text-stone-600">{t.statusLabel}</div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleStatusChange("not_started")}
            disabled={isPending}
            className={getStatusButtonClassName(progress.progressStatus, "not_started")}
          >
            {t.notStarted}
          </button>
          <button
            type="button"
            onClick={() => handleStatusChange("in_progress")}
            disabled={isPending}
            className={getStatusButtonClassName(progress.progressStatus, "in_progress")}
          >
            {t.inProgress}
          </button>
          <button
            type="button"
            onClick={() => handleStatusChange("completed")}
            disabled={isPending}
            className={getStatusButtonClassName(progress.progressStatus, "completed")}
          >
            {t.completed}
          </button>
        </div>
      </div>

      <label className="mt-4 block space-y-2">
        <span className="text-sm text-stone-600">{t.noteLabel}</span>
        <textarea
          rows={4}
          value={noteText}
          onChange={(event) => setNoteText(event.target.value)}
          placeholder={t.notePlaceholder}
          className="w-full rounded-[1rem] border border-stone-300 bg-white px-3 py-3 text-sm text-stone-900"
        />
      </label>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleNoteSave}
          disabled={isPending || !noteDirty}
          className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 disabled:opacity-60"
        >
          {isPending ? t.saving : t.saveNote}
        </button>

        {message ? <p className="text-sm text-stone-600">{message}</p> : null}
      </div>
    </section>
  );
}
