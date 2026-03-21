export type ContentProgressStatus =
  | "not_started"
  | "in_progress"
  | "completed";

export type UserContentProgressRow = {
  id: string;
  user_id: string;
  content_item_id: string;
  is_saved: boolean;
  progress_status: ContentProgressStatus;
  note_text: string | null;
  saved_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  last_viewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ContentProgressSnapshot = {
  isSaved: boolean;
  progressStatus: ContentProgressStatus;
  noteText: string;
  savedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  lastViewedAt: string | null;
};

export type UserProgressListItem = {
  contentItemId: string;
  title: string;
  slug: string | null;
  categories: string[];
  unlockedAt: string | null;
  isSaved: boolean;
  progressStatus: ContentProgressStatus;
  noteText: string;
  savedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  lastViewedAt: string | null;
};

export function toContentProgressSnapshot(
  row: UserContentProgressRow | null
): ContentProgressSnapshot {
  return {
    isSaved: row?.is_saved ?? false,
    progressStatus: row?.progress_status ?? "not_started",
    noteText: row?.note_text ?? "",
    savedAt: row?.saved_at ?? null,
    startedAt: row?.started_at ?? null,
    completedAt: row?.completed_at ?? null,
    lastViewedAt: row?.last_viewed_at ?? null,
  };
}
