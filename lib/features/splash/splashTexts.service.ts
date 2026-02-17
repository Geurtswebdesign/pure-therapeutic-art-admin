import { supabase } from "@/lib/supabase-client";

export async function fetchRandomSplashText(language: string) {
  const { data, error } = await supabase
    .from("splash_texts")
    .select("text")
    .eq("active", true)
    .eq("language", language);

  if (error || !data || data.length === 0) {
    return null;
  }

  const randomIndex = Math.floor(Math.random() * data.length);
  return data[randomIndex].text;
}
