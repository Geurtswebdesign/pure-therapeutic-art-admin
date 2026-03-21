"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasAccess } from "@/lib/unlock/hasAccess";
import {
  getUserContentProgress,
  isContentProgressStorageReady,
  upsertUserContentProgress,
} from "@/lib/content/progress";
import {
  type ContentProgressStatus,
  toContentProgressSnapshot,
} from "@/lib/content/progress-types";

type ProgressContentRow = {
  id: string;
  status: string | null;
  credit_cost: number | null;
};

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Je moet ingelogd zijn.");
  }

  return user;
}

async function assertUserCanTrackContent(userId: string, contentItemId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("content_items")
    .select("id, status, credit_cost")
    .eq("id", contentItemId)
    .maybeSingle<ProgressContentRow>();

  if (error || !data || data.status !== "published") {
    throw new Error("Deze content is niet beschikbaar.");
  }

  if ((data.credit_cost ?? 0) > 0) {
    const userHasAccess = await hasAccess(userId, contentItemId);
    if (!userHasAccess) {
      throw new Error("Je hebt nog geen toegang tot deze content.");
    }
  }

  const storageReady = await isContentProgressStorageReady();
  if (!storageReady) {
    throw new Error("Voortgang is nog niet beschikbaar.");
  }
}

function revalidateProgressPaths() {
  revalidatePath("/account");
  revalidatePath("/content");
}

export async function toggleSavedContent(contentItemId: string) {
  const user = await requireUser();
  await assertUserCanTrackContent(user.id, contentItemId);

  const existing = await getUserContentProgress(user.id, contentItemId);
  const now = new Date().toISOString();
  const nextSaved = !existing?.is_saved;

  const next = await upsertUserContentProgress(user.id, contentItemId, {
    is_saved: nextSaved,
    saved_at: nextSaved ? now : null,
  });

  revalidateProgressPaths();
  return toContentProgressSnapshot(next);
}

export async function setContentProgressStatus(
  contentItemId: string,
  status: ContentProgressStatus
) {
  const user = await requireUser();
  await assertUserCanTrackContent(user.id, contentItemId);

  const existing = await getUserContentProgress(user.id, contentItemId);
  const now = new Date().toISOString();

  const next =
    status === "completed"
      ? await upsertUserContentProgress(user.id, contentItemId, {
          progress_status: status,
          started_at: existing?.started_at ?? now,
          completed_at: now,
        })
      : status === "in_progress"
        ? await upsertUserContentProgress(user.id, contentItemId, {
            progress_status: status,
            started_at: existing?.started_at ?? now,
            completed_at: null,
          })
        : await upsertUserContentProgress(user.id, contentItemId, {
            progress_status: status,
            started_at: null,
            completed_at: null,
          });

  revalidateProgressPaths();
  return toContentProgressSnapshot(next);
}

export async function saveContentNote(contentItemId: string, noteText: string) {
  const user = await requireUser();
  await assertUserCanTrackContent(user.id, contentItemId);

  const next = await upsertUserContentProgress(user.id, contentItemId, {
    note_text: noteText,
  });

  revalidateProgressPaths();
  return toContentProgressSnapshot(next);
}

export async function touchContentLastViewed(contentItemId: string) {
  const user = await requireUser();
  await assertUserCanTrackContent(user.id, contentItemId);

  const next = await upsertUserContentProgress(user.id, contentItemId, {
    last_viewed_at: new Date().toISOString(),
  });

  return toContentProgressSnapshot(next);
}
