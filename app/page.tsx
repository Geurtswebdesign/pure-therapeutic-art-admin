import Link from "next/link";
import { getPrimaryLanguage } from "@/lib/i18n/getPrimaryLanguage";
import { resolveUiLanguage } from "@/lib/i18n/runtime";
import { getAppMessages } from "@/lib/i18n/appMessages";
import { getHomepageCategories } from "@/lib/content/public-queries";
import PublicAppShell from "@/components/public/PublicAppShell";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { createAdminClient } from "@/lib/supabase/admin";

type ProfileRow = {
  display_name: string | null;
  profile_data?: {
    first_name?: string | null;
    avatar_url?: string | null;
    profile_image?: string | null;
  } | null;
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function Home() {
  const language = resolveUiLanguage(await getPrimaryLanguage());
  const t = getAppMessages(language).home;
  const user = await getCurrentUser();
  const supabaseAdmin = createAdminClient();

  let profile: ProfileRow | null = null;
  if (user) {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("display_name, profile_data")
      .eq("user_id", user.id)
      .maybeSingle<ProfileRow>();
    profile = data ?? null;
  }

  const displayName =
    profile?.display_name ??
    profile?.profile_data?.first_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    "";
  const avatarUrl =
    profile?.profile_data?.avatar_url ??
    profile?.profile_data?.profile_image ??
    user?.user_metadata?.avatar_url ??
    user?.user_metadata?.picture ??
    "";
  const motivationalText =
    "Mooi dat je er bent. Pak een moment voor jezelf en zet vandaag een kleine stap.";
  const categories = await getHomepageCategories(50);
  return (
    <PublicAppShell activeTab="home" subtitle="Rust, groei en troost">
      <section className="space-y-4">
        <div className="rounded-[1.75rem] border border-stone-200 bg-white px-4 py-4 shadow-sm">
          {user ? (
            <div className="grid grid-cols-[72px_1fr] gap-4">
              <div className="flex flex-col items-center gap-2">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={displayName || "Gebruiker"}
                    className="h-[72px] w-[72px] overflow-hidden rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_top,#c47f62_0%,#b34c42_35%,#7d2f2f_100%)] text-xl font-semibold text-white">
                    {getInitials(displayName)}
                  </div>
                )}
                <span className="text-xs text-stone-500">
                  {displayName || "Gebruiker"}
                </span>
              </div>

              <div className="space-y-2">
                <h2 className="font-serif text-2xl leading-tight text-stone-950">
                  Welkom terug
                </h2>
                <p className="text-sm leading-6 text-stone-600">
                  {motivationalText}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <h2 className="font-serif text-2xl leading-tight text-stone-950">
                {t.title}
              </h2>
              <p className="text-sm leading-6 text-stone-600">
                {t.subtitle}
              </p>
              <div className="flex gap-2 pt-1">
                <Link
                  className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-800"
                  href="/account"
                >
                  {t.login}
                </Link>
                <Link
                  className="rounded-full bg-stone-900 px-4 py-2 text-sm text-white"
                  href="/login"
                >
                  Aanmelden
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {categories.length ? (
            categories.map((category, index) => (
              <Link
                key={category.id}
                href={`/content?category=${category.slug}`}
                className="group relative min-h-[132px] overflow-hidden rounded-[1.4rem] border border-stone-300 shadow-[0_8px_20px_rgba(31,24,19,0.15)] transition hover:-translate-y-0.5"
                style={
                  category.featured_image_url
                    ? {
                        backgroundImage: `url(${category.featured_image_url})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : undefined
                }
              >
                {!category.featured_image_url ? (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#c9b3a3_0%,#a88875_40%,#6d4b40_100%)]" />
                ) : null}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(24,18,14,0.08)_25%,rgba(24,18,14,0.72)_100%)]" />
                <div className="absolute left-2 top-2 rounded-full bg-white/85 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-stone-700">
                  {index + 1}
                </div>
                <div className="absolute inset-x-2 bottom-2 rounded-xl bg-black/35 px-2 py-2 text-center backdrop-blur-[1px]">
                  <p className="text-sm font-semibold leading-5 text-white">
                    {category.name}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-2 rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50 p-5 text-sm text-stone-600">
              Nog geen content beschikbaar.
            </div>
          )}
        </div>
      </section>
    </PublicAppShell>
  );
}
