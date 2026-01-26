"use server";

import { supabaseAdmin } from "@/lib/supabase-admin";

export async function uploadContentImage(
  file: File,
  contentItemId: string
) {
  const ext = file.name.split(".").pop();
  const fileName = `${contentItemId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from("media")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error("Upload failed");
  }

  const { data } = supabaseAdmin.storage
    .from("media")
    .getPublicUrl(fileName);

  return data.publicUrl;
}
