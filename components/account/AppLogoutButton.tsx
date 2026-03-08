"use client";

import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function AppLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await supabaseBrowser.auth.signOut();
    router.push("/account");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="inline-flex w-full items-center justify-center rounded-full bg-[#adc3ae] px-4 py-2 text-sm font-medium text-stone-900 transition hover:bg-[#99b39c]"
    >
      Uitloggen
    </button>
  );
}
