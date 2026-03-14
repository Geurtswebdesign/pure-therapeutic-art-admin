import { supabase } from "@/lib/supabase/browser";

export async function uploadMediaAssetClient(
  file: File,
  pathPrefix: string
) {
  const ext = file.name.split(".").pop() || "bin";
  const normalizedPrefix = pathPrefix.replace(/^\/+|\/+$/g, "");
  const fileName = `${normalizedPrefix}/${crypto.randomUUID()}.${ext}`;

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

  const { data } = supabase.storage.from("media").getPublicUrl(fileName);
  return data.publicUrl;
}

export async function uploadImageClient(
  file: File,
  contentItemId: string
) {
  return uploadMediaAssetClient(file, contentItemId);
}
