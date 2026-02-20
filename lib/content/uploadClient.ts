import { supabase } from "@/lib/supabase/browser";

export async function uploadImageClient(
  file: File,
  contentItemId: string
) {
  const ext = file.name.split(".").pop();
  const fileName = `${contentItemId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("media")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Upload error", error);
    throw error;
  }

  const { error: insertError } = await supabase.from("media_assets").insert({
    file_path: `media/${fileName}`,
    mime_type: file.type || "application/octet-stream",
    alt_text: null,
  });

  if (insertError) {
    console.warn("media_assets insert failed:", insertError.message);
  }

  const { data } = supabase.storage
    .from("media")
    .getPublicUrl(fileName);

  console.log("PUBLIC URL:", data.publicUrl); // 👈 BELANGRIJK

  return data.publicUrl;
}
