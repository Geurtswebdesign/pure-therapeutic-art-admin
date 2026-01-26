import { supabase } from "@/lib/supabaseClient";

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

  const { data } = supabase.storage
    .from("media")
    .getPublicUrl(fileName);

  console.log("PUBLIC URL:", data.publicUrl); // 👈 BELANGRIJK

  return data.publicUrl;
}
