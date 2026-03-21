"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  ContentProgressStatus,
  UserProgressListItem,
  UserContentProgressRow,
} from "@/lib/content/progress-types";

type ProgressCollectionResult = {
  storageReady: boolean;
  unlocked: UserProgressListItem[];
  inProgress: UserProgressListItem[];
  completed: UserProgressListItem[];
  recent: UserProgressListItem[];
};

type ProgressContentRow = {
  id: string;
  title: string | null;
  slug: string | null;
  status: string | null;
};

type ProgressRelationshipRow = {
  content_item_id: string;
  term_id: string;
};

type ProgressTermRow = {
  id: string;
  name: string;
  taxonomy_id: string;
};

type UnlockRow = {
  content_item_id: string | null;
  unlocked_at: string;
};

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

function toTimestamp(value: string | null | undefined) {
  return value ? new Date(value).getTime() : 0;
}

function compareByDateDesc(
  left: string | null | undefined,
  right: string | null | undefined
) {
  return toTimestamp(right) - toTimestamp(left);
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

async function getUnlockedContentBase(userId: string) {
  const supabase = createAdminClient();
  const { data: unlockRows, error: unlockError } = await supabase
    .from("content_unlocks")
    .select("content_item_id, unlocked_at")
    .eq("user_id", userId)
    .order("unlocked_at", { ascending: false });

  if (unlockError) {
    throw unlockError;
  }

  const latestUnlockByContentId = new Map<string, string>();
  for (const row of (unlockRows ?? []) as UnlockRow[]) {
    if (!row.content_item_id || latestUnlockByContentId.has(row.content_item_id)) {
      continue;
    }

    latestUnlockByContentId.set(row.content_item_id, row.unlocked_at);
  }

  const contentIds = Array.from(latestUnlockByContentId.keys());
  if (!contentIds.length) {
    return [];
  }

  const { data: contentItems, error: contentItemsError } = await supabase
    .from("content_items")
    .select("id, title, slug, status")
    .in("id", contentIds)
    .eq("status", "published");

  if (contentItemsError) {
    throw contentItemsError;
  }

  const contentById = new Map(
    ((contentItems ?? []) as ProgressContentRow[]).map((item) => [item.id, item])
  );

  const categoriesByContentId = new Map<string, string[]>();
  const { data: categoryTaxonomy, error: categoryTaxonomyError } = await supabase
    .from("content_taxonomies")
    .select("id")
    .eq("slug", "category")
    .maybeSingle<{ id: string }>();

  if (categoryTaxonomyError) {
    throw categoryTaxonomyError;
  }

  if (categoryTaxonomy?.id) {
    const { data: relationships, error: relationshipsError } = await supabase
      .from("content_term_relationships")
      .select("content_item_id, term_id")
      .in("content_item_id", contentIds);

    if (relationshipsError) {
      throw relationshipsError;
    }

    const categoryTermIds = Array.from(
      new Set(
        ((relationships ?? []) as ProgressRelationshipRow[])
          .map((relationship) => relationship.term_id)
          .filter((value): value is string => Boolean(value))
      )
    );

    if (categoryTermIds.length) {
      const { data: terms, error: termsError } = await supabase
        .from("content_terms")
        .select("id, name, taxonomy_id")
        .in("id", categoryTermIds)
        .eq("taxonomy_id", categoryTaxonomy.id);

      if (termsError) {
        throw termsError;
      }

      const termById = new Map(
        ((terms ?? []) as ProgressTermRow[]).map((term) => [term.id, term])
      );

      for (const relationship of (relationships ?? []) as ProgressRelationshipRow[]) {
        const term = termById.get(relationship.term_id);
        if (!term) continue;

        const currentCategories =
          categoriesByContentId.get(relationship.content_item_id) ?? [];
        currentCategories.push(term.name);
        categoriesByContentId.set(relationship.content_item_id, currentCategories);
      }
    }
  }

  return contentIds
    .map((contentItemId) => {
      const item = contentById.get(contentItemId);
      if (!item) return null;

      return {
        contentItemId: item.id,
        title: item.title?.trim() || "Onbekende content",
        slug: item.slug,
        categories: categoriesByContentId.get(item.id) ?? [],
        unlockedAt: latestUnlockByContentId.get(contentItemId) ?? null,
      };
    })
    .filter(
      (
        item
      ): item is Pick<
        UserProgressListItem,
        "contentItemId" | "title" | "slug" | "categories" | "unlockedAt"
      > => Boolean(item)
    );
}

async function buildUserProgressItems(
  userId: string
): Promise<UserProgressListItem[]> {
  const baseItems = await getUnlockedContentBase(userId);
  if (!baseItems.length) {
    return [];
  }

  const storageReady = await isContentProgressStorageReady();
  let progressByContentId = new Map<
    string,
    Pick<
      UserContentProgressRow,
      | "content_item_id"
      | "is_saved"
      | "progress_status"
      | "note_text"
      | "saved_at"
      | "started_at"
      | "completed_at"
      | "last_viewed_at"
    >
  >();

  if (storageReady) {
    const supabase = createAdminClient();
    const { data: rows, error } = await supabase
      .from("user_content_progress")
      .select(
        "content_item_id, is_saved, progress_status, note_text, saved_at, started_at, completed_at, last_viewed_at"
      )
      .eq("user_id", userId);

    if (error) {
      if (!isMissingProgressTableError(error)) {
        throw error;
      }
    } else {
      progressByContentId = new Map(
        ((rows ?? []) as Array<
          Pick<
            UserContentProgressRow,
            | "content_item_id"
            | "is_saved"
            | "progress_status"
            | "note_text"
            | "saved_at"
            | "started_at"
            | "completed_at"
            | "last_viewed_at"
          >
        >).map((row) => [row.content_item_id, row])
      );
    }
  }

  return baseItems.map((item) => {
    const progress = progressByContentId.get(item.contentItemId);

    return {
      ...item,
      isSaved: progress?.is_saved ?? false,
      progressStatus: progress?.progress_status ?? "not_started",
      noteText: progress?.note_text ?? "",
      savedAt: progress?.saved_at ?? null,
      startedAt: progress?.started_at ?? null,
      completedAt: progress?.completed_at ?? null,
      lastViewedAt: progress?.last_viewed_at ?? null,
    };
  });
}

export async function getUserProgressCollections(
  userId: string
): Promise<ProgressCollectionResult> {
  const storageReady = await isContentProgressStorageReady();
  const items = await buildUserProgressItems(userId);

  const unlocked = [...items]
    .sort((left, right) => compareByDateDesc(left.unlockedAt, right.unlockedAt))
    .slice(0, 6);

  const inProgress = items
    .filter(
      (item) =>
        item.progressStatus !== "completed" &&
        (item.progressStatus === "in_progress" || Boolean(item.lastViewedAt))
    )
    .sort((left, right) =>
      compareByDateDesc(
        left.lastViewedAt ?? left.startedAt ?? left.unlockedAt,
        right.lastViewedAt ?? right.startedAt ?? right.unlockedAt
      )
    )
    .slice(0, 6);

  const completed = items
    .filter((item) => item.progressStatus === "completed")
    .sort((left, right) => compareByDateDesc(left.completedAt, right.completedAt))
    .slice(0, 6);

  const recent = items
    .filter((item) => Boolean(item.lastViewedAt))
    .sort((left, right) => compareByDateDesc(left.lastViewedAt, right.lastViewedAt))
    .slice(0, 6);

  return {
    storageReady,
    unlocked,
    inProgress,
    completed,
    recent,
  };
}

export async function listUserUnlockedContent(userId: string) {
  return (await getUserProgressCollections(userId)).unlocked;
}

export async function listUserInProgressContent(userId: string) {
  return (await getUserProgressCollections(userId)).inProgress;
}

export async function listUserCompletedContent(userId: string) {
  return (await getUserProgressCollections(userId)).completed;
}

export async function listRecentlyViewedContent(userId: string) {
  return (await getUserProgressCollections(userId)).recent;
}
