"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  ContentProgressStatus,
  UserProgressListItem,
  UserContentProgressRow,
  UserThemeProgressSummary,
} from "@/lib/content/progress-types";

type ProgressCollectionResult = {
  storageReady: boolean;
  themes: UserThemeProgressSummary[];
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

type ThemePageRow = {
  id: string;
  slug: string | null;
  title: string | null;
  sort_order: number | null;
};

type ThemeSectionRow = {
  id: string;
  theme_page_id: string | null;
  sort_order: number | null;
};

type ThemeSectionItemRow = {
  theme_section_id: string | null;
  content_item_id: string | null;
  sort_order: number | null;
  custom_title?: string | null;
};

type ThemeLinkCandidate = {
  themeId: string;
  themeTitle: string;
  themeSlug: string | null;
  themeSortOrder: number;
  themeSectionSortOrder: number;
  themeItemSortOrder: number;
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

function buildProgressContentHref(slug: string | null) {
  return slug ? `/content/${slug}` : null;
}

function compareThemeLinkCandidates(
  left: ThemeLinkCandidate,
  right: ThemeLinkCandidate
) {
  if (left.themeSortOrder !== right.themeSortOrder) {
    return left.themeSortOrder - right.themeSortOrder;
  }

  if (left.themeSectionSortOrder !== right.themeSectionSortOrder) {
    return left.themeSectionSortOrder - right.themeSectionSortOrder;
  }

  if (left.themeItemSortOrder !== right.themeItemSortOrder) {
    return left.themeItemSortOrder - right.themeItemSortOrder;
  }

  return left.themeTitle.localeCompare(right.themeTitle, "nl");
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

  const themeByContentId = new Map<string, ThemeLinkCandidate>();
  const { data: themeSectionLinks, error: themeSectionLinksError } = await supabase
    .from("content_theme_section_items")
    .select("theme_section_id, content_item_id, sort_order")
    .in("content_item_id", contentIds);

  if (themeSectionLinksError) {
    throw themeSectionLinksError;
  }

  const themeSectionIds = Array.from(
    new Set(
      ((themeSectionLinks ?? []) as ThemeSectionItemRow[])
        .map((row) => row.theme_section_id)
        .filter((value): value is string => Boolean(value))
    )
  );

  if (themeSectionIds.length) {
    const { data: themeSections, error: themeSectionsError } = await supabase
      .from("content_theme_sections")
      .select("id, theme_page_id, sort_order")
      .in("id", themeSectionIds);

    if (themeSectionsError) {
      throw themeSectionsError;
    }

    const themePageIds = Array.from(
      new Set(
        ((themeSections ?? []) as ThemeSectionRow[])
          .map((row) => row.theme_page_id)
          .filter((value): value is string => Boolean(value))
      )
    );

    if (themePageIds.length) {
      const { data: themePages, error: themePagesError } = await supabase
        .from("content_theme_pages")
        .select("id, slug, title, sort_order")
        .in("id", themePageIds)
        .eq("is_published", true);

      if (themePagesError) {
        throw themePagesError;
      }

      const sectionById = new Map(
        ((themeSections ?? []) as ThemeSectionRow[]).map((section) => [
          section.id,
          section,
        ])
      );
      const pageById = new Map(
        ((themePages ?? []) as ThemePageRow[]).map((page) => [page.id, page])
      );
      const candidatesByContentId = new Map<string, ThemeLinkCandidate[]>();

      for (const link of (themeSectionLinks ?? []) as ThemeSectionItemRow[]) {
        if (!link.content_item_id || !link.theme_section_id) continue;

        const section = sectionById.get(link.theme_section_id);
        const page = section?.theme_page_id
          ? pageById.get(section.theme_page_id) ?? null
          : null;

        if (!section || !page) continue;

        const candidates = candidatesByContentId.get(link.content_item_id) ?? [];
        candidates.push({
          themeId: page.id,
          themeTitle: page.title?.trim() || "Ongetiteld thema",
          themeSlug: page.slug,
          themeSortOrder: page.sort_order ?? 0,
          themeSectionSortOrder: section.sort_order ?? 0,
          themeItemSortOrder: link.sort_order ?? 0,
        });
        candidatesByContentId.set(link.content_item_id, candidates);
      }

      for (const [contentItemId, candidates] of candidatesByContentId.entries()) {
        candidates.sort(compareThemeLinkCandidates);
        const primaryTheme = candidates[0];
        if (primaryTheme) {
          themeByContentId.set(contentItemId, primaryTheme);
        }
      }
    }
  }

  return contentIds
    .map((contentItemId) => {
      const item = contentById.get(contentItemId);
      if (!item) return null;
      const theme = themeByContentId.get(item.id);

      return {
        contentItemId: item.id,
        title: item.title?.trim() || "Onbekende content",
        slug: item.slug,
        categories: categoriesByContentId.get(item.id) ?? [],
        themeId: theme?.themeId ?? null,
        themeTitle: theme?.themeTitle ?? null,
        themeSlug: theme?.themeSlug ?? null,
        themeSortOrder: theme?.themeSortOrder ?? null,
        themeSectionSortOrder: theme?.themeSectionSortOrder ?? null,
        themeItemSortOrder: theme?.themeItemSortOrder ?? null,
        unlockedAt: latestUnlockByContentId.get(contentItemId) ?? null,
      };
    })
    .filter(
      (
        item
      ): item is Pick<
        UserProgressListItem,
        | "contentItemId"
        | "title"
        | "slug"
        | "categories"
        | "themeId"
        | "themeTitle"
        | "themeSlug"
        | "themeSortOrder"
        | "themeSectionSortOrder"
        | "themeItemSortOrder"
        | "unlockedAt"
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

async function buildThemeProgressSummaries(
  items: UserProgressListItem[]
): Promise<UserThemeProgressSummary[]> {
  const themeIds = Array.from(
    new Set(
      items
        .map((item) => item.themeId)
        .filter((value): value is string => Boolean(value))
    )
  );

  if (!themeIds.length) {
    return [];
  }

  const supabase = createAdminClient();
  const { data: themeSections, error: themeSectionsError } = await supabase
    .from("content_theme_sections")
    .select("id, theme_page_id, sort_order")
    .in("theme_page_id", themeIds);

  if (themeSectionsError) {
    throw themeSectionsError;
  }

  const themeSectionRows =
    ((themeSections ?? []) as ThemeSectionRow[]).filter((row) =>
      Boolean(row.id && row.theme_page_id)
    );
  const sectionById = new Map(themeSectionRows.map((section) => [section.id, section]));
  const sectionIds = themeSectionRows.map((section) => section.id);

  if (!sectionIds.length) {
    return [];
  }

  const { data: themeSectionItems, error: themeSectionItemsError } = await supabase
    .from("content_theme_section_items")
    .select("theme_section_id, content_item_id, custom_title, sort_order")
    .in("theme_section_id", sectionIds);

  if (themeSectionItemsError) {
    throw themeSectionItemsError;
  }

  const orderedThemeSectionItems =
    ((themeSectionItems ?? []) as ThemeSectionItemRow[])
      .filter(
        (row): row is ThemeSectionItemRow & {
          theme_section_id: string;
          content_item_id: string;
        } => Boolean(row.theme_section_id && row.content_item_id)
      )
      .sort((left, right) => {
        const leftSectionOrder =
          sectionById.get(left.theme_section_id)?.sort_order ?? 0;
        const rightSectionOrder =
          sectionById.get(right.theme_section_id)?.sort_order ?? 0;

        if (leftSectionOrder !== rightSectionOrder) {
          return leftSectionOrder - rightSectionOrder;
        }

        return (left.sort_order ?? 0) - (right.sort_order ?? 0);
      });

  const themeContentIds = Array.from(
    new Set(orderedThemeSectionItems.map((row) => row.content_item_id))
  );

  if (!themeContentIds.length) {
    return [];
  }

  const { data: contentRows, error: contentRowsError } = await supabase
    .from("content_items")
    .select("id, title, slug, status")
    .in("id", themeContentIds)
    .eq("status", "published");

  if (contentRowsError) {
    throw contentRowsError;
  }

  const contentById = new Map(
    ((contentRows ?? []) as ProgressContentRow[]).map((item) => [item.id, item])
  );
  const orderedContentIdsByThemeId = new Map<string, string[]>();

  for (const row of orderedThemeSectionItems) {
    const section = sectionById.get(row.theme_section_id);
    if (!section?.theme_page_id) continue;
    if (!contentById.has(row.content_item_id)) continue;

    const currentIds = orderedContentIdsByThemeId.get(section.theme_page_id) ?? [];
    if (!currentIds.includes(row.content_item_id)) {
      currentIds.push(row.content_item_id);
      orderedContentIdsByThemeId.set(section.theme_page_id, currentIds);
    }
  }

  const itemsByThemeId = new Map<string, UserProgressListItem[]>();
  for (const item of items) {
    if (!item.themeId) continue;
    const currentItems = itemsByThemeId.get(item.themeId) ?? [];
    currentItems.push(item);
    itemsByThemeId.set(item.themeId, currentItems);
  }

  const summaries = Array.from(itemsByThemeId.entries())
    .map(([themeId, themeItems]) => {
      const themeTitle = themeItems[0]?.themeTitle?.trim() || "Ongetiteld thema";
      const themeSlug = themeItems[0]?.themeSlug ?? null;
      const orderedThemeContentIds = orderedContentIdsByThemeId.get(themeId) ?? [];
      const totalChapterCount = orderedThemeContentIds.length || themeItems.length;
      const unlockedChapterCount = themeItems.length;
      const completedChapterCount = themeItems.filter(
        (item) => item.progressStatus === "completed"
      ).length;
      const inProgressChapterCount = themeItems.filter(
        (item) => item.progressStatus === "in_progress"
      ).length;

      const activeContinueItem = [...themeItems]
        .filter((item) => item.progressStatus === "in_progress")
        .sort((left, right) =>
          compareByDateDesc(
            left.lastViewedAt ?? left.startedAt ?? left.unlockedAt,
            right.lastViewedAt ?? right.startedAt ?? right.unlockedAt
          )
        )[0];

      const orderedUnlockedItems = orderedThemeContentIds
        .map((contentItemId) =>
          themeItems.find((item) => item.contentItemId === contentItemId) ?? null
        )
        .filter((item): item is UserProgressListItem => Boolean(item));

      const nextOrderedItem = orderedUnlockedItems.find(
        (item) => item.progressStatus !== "completed"
      );

      const continueItem = activeContinueItem ?? nextOrderedItem ?? null;
      const latestActivityAt = [...themeItems]
        .map(
          (item) =>
            item.lastViewedAt ??
            item.completedAt ??
            item.startedAt ??
            item.unlockedAt
        )
        .sort(compareByDateDesc)[0] ?? null;

      return {
        id: themeId,
        title: themeTitle,
        slug: themeSlug,
        themeHref: themeSlug ? `/content/themas/${themeSlug}` : null,
        continueHref: continueItem
          ? buildProgressContentHref(continueItem.slug)
          : null,
        continueTitle: continueItem?.title ?? null,
        totalChapterCount,
        unlockedChapterCount,
        completedChapterCount,
        inProgressChapterCount,
        latestActivityAt,
        themeSortOrder: themeItems[0]?.themeSortOrder ?? Number.MAX_SAFE_INTEGER,
      };
    })
    .sort((left, right) => {
      const activityDifference = compareByDateDesc(
        left.latestActivityAt,
        right.latestActivityAt
      );
      if (activityDifference !== 0) {
        return activityDifference;
      }

      if (left.themeSortOrder !== right.themeSortOrder) {
        return left.themeSortOrder - right.themeSortOrder;
      }

      return left.title.localeCompare(right.title, "nl");
    })
    .map(({ themeSortOrder: _themeSortOrder, ...summary }) => summary);

  return summaries;
}

export async function getUserProgressCollections(
  userId: string
): Promise<ProgressCollectionResult> {
  const storageReady = await isContentProgressStorageReady();
  const items = await buildUserProgressItems(userId);
  const themes = await buildThemeProgressSummaries(items);

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
    themes,
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
