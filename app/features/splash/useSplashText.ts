import { useEffect, useState } from "react";
import { fetchRandomSplashText } from "@/app/services/cms/splashTexts.service";

export function useSplashText(language: string) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    fetchRandomSplashText(language).then((result: string | null) => {
      setText(
        result ??
        "Rust, groei en troost in één plek" // fallback
      );
    });
  }, [language]);

  return text;
}
