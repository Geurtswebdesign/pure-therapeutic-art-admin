import Image from "next/image";
import Link from "next/link";
import { getAppLanguage } from "@/lib/i18n/getAppLanguage";
import { resolveUiLanguage } from "@/lib/i18n/runtime";
import { getAppMessages } from "@/lib/i18n/appMessages";
import { getPublicAppMessages } from "@/lib/i18n/publicAppMessages";
import { getHomepageCategories } from "@/lib/content/public-queries";
import { getCategoryStyle } from "@/lib/content/categoryStyles";
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

async function getSafeProfile(userId: string): Promise<ProfileRow | null> {
  try {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("display_name, profile_data")
      .eq("user_id", userId)
      .maybeSingle<ProfileRow>();

    if (error) {
      console.error("[Home] profile", error);
      return null;
    }

    return data ?? null;
  } catch (error) {
    console.error("[Home] profile", error);
    return null;
  }
}

async function getSafeHomepageCategories(preferredLanguage?: string) {
  try {
    return await getHomepageCategories(50, {
      homepageOnly: true,
      preferredLanguage,
    });
  } catch (error) {
    console.error("[Home] homepage categories", error);
    return [];
  }
}

export default async function Home() {
  const language = resolveUiLanguage(await getAppLanguage());
  const t = getAppMessages(language).home;
  const publicT = getPublicAppMessages(language);
  const user = await getCurrentUser();

  const [profile, categories] = await Promise.all([
    user ? getSafeProfile(user.id) : Promise.resolve<ProfileRow | null>(null),
    getSafeHomepageCategories(language),
  ]);

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
  const motivationalText = publicT.home.signedInMotivation;
  return (
    <PublicAppShell activeTab="home" subtitle={publicT.home.headerSubtitle}>
      <section className="space-y-4">
        <div className="rounded-[1.75rem] border border-stone-200 bg-white px-4 py-4 shadow-sm">
          {user ? (
            <div className="grid grid-cols-[84px_1fr] items-start gap-4">
              <div className="flex flex-col items-center gap-2 pt-1">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt={displayName || publicT.home.userFallback}
                    className="h-[72px] w-[72px] overflow-hidden rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-full bg-[radial-gradient(circle_at_top,#c47f62_0%,#b34c42_35%,#7d2f2f_100%)] text-xl font-semibold text-white">
                    {getInitials(displayName)}
                  </div>
                )}
                <span className="max-w-[84px] text-center text-xs leading-4 text-stone-500">
                  {displayName || publicT.home.userFallback}
                </span>
              </div>

              <div className="space-y-2 pt-1">
                <h2 className="font-serif text-xl leading-tight text-stone-950 sm:text-2xl">
                  {publicT.home.signedInTitle}
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
                  href="/login?next=%2Faccount"
                >
                  {t.login}
                </Link>
                <Link
                  className="rounded-full bg-stone-900 px-4 py-2 text-sm text-white"
                  href="/login?mode=register&next=%2Faccount"
                >
                  {publicT.home.register}
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {categories.length ? (
            categories.map((category) => {
              const style = getCategoryStyle(category.slug);
              return (
              <Link
                key={category.id}
                href={`/content?category=${category.slug}`}
                className={`group flex h-full min-h-[260px] flex-col rounded-[1.5rem] p-3 text-center shadow-sm transition hover:-translate-y-0.5 ${style.cardClass}`}
              >
                <div className="relative mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-white p-2 shadow-[0_10px_28px_rgba(18,20,26,0.14)]">
                  {category.featured_image_url ? (
                    <Image
                      src={category.featured_image_url}
                      alt={category.featured_image_alt || category.name}
                      width={64}
                      height={64}
                      sizes="80px"
                      unoptimized
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className={`h-16 w-16 rounded-full ${style.orbClass}`}
                    />
                  )}
                </div>

                <h3 className="min-h-[40px] text-base font-semibold leading-tight text-[#1f2f43]">
                  {category.name}
                </h3>

                <p className="mt-1 min-h-[40px] line-clamp-2 text-sm leading-5 text-[#31445c]">
                  {category.description || publicT.home.categoryFallbackDescription}
                </p>
                <div className="mt-auto pt-3">
                  <span className="inline-flex rounded-full border border-[#30445c33] bg-white/70 px-3 py-1 text-xs font-medium text-[#1f2f43]">
                    {publicT.home.openCategory}
                  </span>
                </div>
              </Link>
            );
          })
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50 p-5 text-sm text-stone-600">
              {publicT.home.emptyState}
            </div>
          )}
        </div>
      </section>
    </PublicAppShell>
  );
}
