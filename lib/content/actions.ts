"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";

import { createAdminClient } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/auth/getAdminSession';

type AdjustCreditsParams = {
  userId: string;
  delta: number;
  reason: string;
};

type ContentStatus = "all" | "draft" | "published" | "archived";

export async function updateContentItem({
  id,
  title,
  body,
  status,
}: {
  id: string;
  title?: string;
  body?: string;
  status?: ContentStatus;
}) {
  const update: Partial<{
    title: string;
    body: string;
    status: ContentStatus;
  }> = {};

  if (title !== undefined) update.title = title;
  if (body !== undefined) update.body = body;
  if (status !== undefined) update.status = status;

  const { error } = await supabaseAdmin
    .from("content_items")
    .update(update)
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function adjustCredits({
  userId,
  delta,
  reason,
}: AdjustCreditsParams): Promise<void> {
  if (!userId) throw new Error('UserId ontbreekt');
  if (!Number.isInteger(delta)) throw new Error('Delta moet een integer zijn');
  if (!reason || reason.trim().length < 3) {
    throw new Error('Reden is verplicht');
  }

  // ✅ Check admin session
  const session = await getAdminSession();
  if (!session) throw new Error('Niet geautoriseerd');

  const adminId = session.user.id;
  const supabase = createAdminClient();

  // 🔒 Start transaction via RPC pattern
  const { error } = await supabase.rpc(
    'admin_adjust_credits',
    {
      p_user_id: userId,
      p_delta: delta,
      p_reason: reason,
      p_admin_id: adminId,
    }
  );

  if (error) {
    console.error('[adjustCredits]', error);
    throw new Error('Credits aanpassen mislukt');
  }

  // 🔄 Revalidate admin user detail page
  revalidatePath(`/admin/users/${userId}`);
}

export async function deleteContentItem(id: string) {
  if (!id) {
    throw new Error("Missing content id");
  }

  const { error } = await supabaseAdmin
    .from("content_items")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Delete content failed", error);
    throw new Error("Failed to delete content");
  }

  return { success: true };
}
