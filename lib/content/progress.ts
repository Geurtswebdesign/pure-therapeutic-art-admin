"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  ContentProgressStatus,
  UserProgressListItem,
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

function toTimestamp(value: string | null | undefined) {
  return value ? new Date(value).getTime() : 0;
}

function compareByDateDesc(
  left: string | null | undefined,
  right: string | null | undefined
) {
  return toTimestamp(right) - toTimestamp(left);
}

type ProgressCollectionResult = {
  storageReady: boolean;
  inProgress: UserProgressListItem[];
  saved: UserProgressListItem[];
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

async function buildUserProgressItems(
  userId: string
): Promise<UserProgressListItem[]> {
  const supabase = createAdminClient();
  const { data: rows, error } = await supabase
    .from("user_content_progress")
    .select(
      "content_item_id, is_saved, progress_status, note_text, saved_at, started_at, completed_at, last_viewed_at"
    )
    .eq("user_id", userId);

  if (error) {
    if (isMissingProgressTableError(error)) {
      return [];
    }

    throw error;
  }

  const progressRows = (rows ?? []) as Array<
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
  >;

  const contentIds = Array.from(
    new Set(
      progressRows
        .map((row) => row.content_item_id)
        .filter((value): value is string => Boolean(value))
    )
  );

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

  return progressRows
    .map((row) => {
      const item = contentById.get(row.content_item_id);
      if (!item) return null;

      return {
        contentItemId: item.id,
        title: item.title?.trim() || "Onbekende content",
        slug: item.slug,
        categories: categoriesByContentId.get(item.id) ?? [],
        isSaved: row.is_saved,
        progressStatus: row.progress_status,
        noteText: row.note_text ?? "",
        savedAt: row.saved_at,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        lastViewedAt: row.last_viewed_at,
      };
    })
    .filter((item): item is UserProgressListItem => Boolean(item));
}

export async function getUserProgressCollections(
  userId: string
): Promise<ProgressCollectionResult> {
  const storageReady = await isContentProgressStorageReady();
  if (!storageReady) {
    return {
      storageReady: false,
      inProgress: [],
      saved: [],
      completed: [],
      recent: [],
    };
  }

  const items = await buildUserProgressItems(userId);

  const inProgress = items
    .filter((item) => item.progressStatus === "in_progress")
    .sort((left, right) =>
      compareByDateDesc(
        left.lastViewedAt ?? left.startedAt ?? left.savedAt,
        right.lastViewedAt ?? right.startedAt ?? right.savedAt
      )
    )
    .slice(0, 6);

  const saved = items
    .filter((item) => item.isSaved)
    .sort((left, right) => compareByDateDesc(left.savedAt, right.savedAt))
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
    storageReady: true,
    inProgress,
    saved,
    completed,
    recent,
  };
}

export async function listUserSavedContent(userId: string) {
  return (await getUserProgressCollections(userId)).saved;
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
