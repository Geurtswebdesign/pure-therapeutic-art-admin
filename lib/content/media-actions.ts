"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";

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

  const { error: insertError } = await supabaseAdmin
    .from("media_assets")
    .insert({
      file_path: `media/${fileName}`,
      mime_type: file.type || "application/octet-stream",
      alt_text: null,
    });

  if (insertError) {
    console.warn("media_assets insert failed:", insertError.message);
  }

  const { data } = supabaseAdmin.storage
    .from("media")
    .getPublicUrl(fileName);

  return data.publicUrl;
}
