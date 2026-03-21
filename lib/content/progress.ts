"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  ContentProgressStatus,
  UserContentProgressRow,
} from "@/lib/content/progress-types";

function isMissingProgressTableError(error: {
  code?: string;
  message?: string;
} | null) {
  if (!error) return false;

  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    error.message?.includes("user_content_progress") === true
  );
}

function normalizeNoteText(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

export async function isContentProgressStorageReady() {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("user_content_progress")
    .select("id", { head: true, count: "exact" })
    .limit(1);

  if (!error) {
    return true;
  }

  if (isMissingProgressTableError(error)) {
    return false;
  }

  console.error("isContentProgressStorageReady", error);
  return false;
}

export async function getUserContentProgress(
  userId: string,
  contentItemId: string
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("user_content_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("content_item_id", contentItemId)
    .maybeSingle<UserContentProgressRow>();

  if (!error) {
    return data ?? null;
  }

  if (isMissingProgressTableError(error)) {
    return null;
  }

  throw error;
}

export async function upsertUserContentProgress(
  userId: string,
  contentItemId: string,
  changes: {
    is_saved?: boolean;
    progress_status?: ContentProgressStatus;
    note_text?: string | null;
    saved_at?: string | null;
    started_at?: string | null;
    completed_at?: string | null;
    last_viewed_at?: string | null;
  }
) {
  const storageReady = await isContentProgressStorageReady();
  if (!storageReady) {
    throw new Error("Voortgang is nog niet beschikbaar.");
  }

  const existing = await getUserContentProgress(userId, contentItemId);
  const supabase = createAdminClient();

  const payload = {
    user_id: userId,
    content_item_id: contentItemId,
    is_saved: changes.is_saved ?? existing?.is_saved ?? false,
    progress_status:
      changes.progress_status ?? existing?.progress_status ?? "not_started",
    note_text:
      changes.note_text === undefined
        ? existing?.note_text ?? null
        : normalizeNoteText(changes.note_text),
    saved_at:
      changes.saved_at === undefined
        ? existing?.saved_at ?? null
        : changes.saved_at,
    started_at:
      changes.started_at === undefined
        ? existing?.started_at ?? null
        : changes.started_at,
    completed_at:
      changes.completed_at === undefined
        ? existing?.completed_at ?? null
        : changes.completed_at,
    last_viewed_at:
      changes.last_viewed_at === undefined
        ? existing?.last_viewed_at ?? null
        : changes.last_viewed_at,
  };

  const { data, error } = await supabase
    .from("user_content_progress")
    .upsert(payload, { onConflict: "user_id,content_item_id" })
    .select("*")
    .maybeSingle<UserContentProgressRow>();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Voortgang opslaan mislukt.");
  }

  return data;
}
