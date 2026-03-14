"use server";

import { updateContentItem } from "@/lib/content/actions";

export type QuickEditPatch = {
  title?: string;
  status?: "draft" | "published";
  published_at?: string | null;
  credit_cost?: number;
  category_ids?: string[];
  tags?: string[];
};

function hasQuickEditChanges(patch: QuickEditPatch) {
  return !(
    patch.title === undefined &&
    patch.status === undefined &&
    patch.published_at === undefined &&
    patch.credit_cost === undefined &&
    patch.category_ids === undefined
  );
}

export async function quickEditContentItem(
  id: string,
  patch: QuickEditPatch
) {
  if (!hasQuickEditChanges(patch)) {
    return;
  }

  await updateContentItem({
    id,
    title: patch.title,
    status: patch.status,
    published_at: patch.published_at,
    credit_cost: patch.credit_cost,
    category_term_ids: patch.category_ids,
  });
}

export async function bulkQuickEditContentItems(
  ids: string[],
  patch: QuickEditPatch
) {
  if (ids.length === 0 || !hasQuickEditChanges(patch)) {
    return;
  }

  for (const id of ids) {
    await updateContentItem({
      id,
      title: patch.title,
      status: patch.status,
      published_at: patch.published_at,
      credit_cost: patch.credit_cost,
      category_term_ids: patch.category_ids,
    });
  }
}
