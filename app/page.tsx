import Image from "next/image";
import Link from "next/link";
import { getPrimaryLanguage } from "@/lib/i18n/getPrimaryLanguage";
import { resolveUiLanguage } from "@/lib/i18n/runtime";
import { getAppMessages } from "@/lib/i18n/appMessages";
import { getHomepageCategories } from "@/lib/content/public-queries";
import { HOMEPAGE_SEED_CATEGORY_SLUGS } from "@/lib/content/homepageSeedCategories";
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

type CategoryStyle = {
  cardClass: string;
  orbClass: string;
  badge: string;
};

const CATEGORY_STYLE_BY_SLUG: Record<string, CategoryStyle> = {
  gratis: {
    cardClass: "bg-teal-100",
    orbClass: "bg-[radial-gradient(circle_at_30%_30%,#e7fffb_0%,#a7efe4_55%,#67d8c8_100%)]",
    badge: "🎁",
  },
  "cognitie-inzicht": {
    cardClass: "bg-[#e3dbef]",
    orbClass: "bg-[radial-gradient(circle_at_35%_30%,#2c0838_0%,#0e0818_62%,#07060f_100%)]",
    badge: "🧠",
  },
  "emoties-innerlijke-beleving": {
    cardClass: "bg-[#ead8e7]",
    orbClass: "bg-[radial-gradient(circle_at_35%_30%,#f0dede_0%,#d8d8d8_55%,#c2c2c2_100%)]",
    badge: "❤️",
  },
  "gedrag-interactie": {
    cardClass: "bg-[#f2e3c8]",
    orbClass: "bg-[radial-gradient(circle_at_30%_30%,#ffb01f_0%,#ef8b00_48%,#d76d00_100%)]",
    badge: "👥",
  },
  "lichaam-zintuigen": {
    cardClass: "bg-[#cddff0]",
    orbClass: "bg-[radial-gradient(circle_at_35%_30%,#28a6ff_0%,#0a86da_55%,#0471c2_100%)]",
    badge: "🧘",
  },
  "natuur-symbolische-kracht": {
    cardClass: "bg-[#cde8d2]",
    orbClass: "bg-[radial-gradient(circle_at_35%_30%,#cad6c9_0%,#aac2a9_50%,#8faa92_100%)]",
    badge: "🌿",
  },
  "zingeving-ritualen-spiritualiteit": {
    cardClass: "bg-[#e3dbef]",
    orbClass: "bg-[radial-gradient(circle_at_35%_30%,#5f9c62_0%,#2f6840_50%,#1f3f2c_100%)]",
    badge: "🪷",
  },
  "specifieke-doelgroepen-context": {
    cardClass: "bg-[#efe4b8]",
    orbClass: "bg-[radial-gradient(circle_at_35%_30%,#fafafa_0%,#ededed_52%,#d8d8d8_100%)]",
    badge: "🧑‍🤝‍🧑",
  },
};

function getCategoryStyle(slug: string): CategoryStyle {
  return (
    CATEGORY_STYLE_BY_SLUG[slug] ?? {
      cardClass: "bg-[#e8e3ee]",
      orbClass: "bg-[radial-gradient(circle_at_35%_30%,#d7d7d7_0%,#bdbdbd_60%,#a0a0a0_100%)]",
      badge: "✨",
    }
  );
}

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
  const categories = await getHomepageCategories(50, HOMEPAGE_SEED_CATEGORY_SLUGS);
  return (
    <PublicAppShell activeTab="home" subtitle="Rust, groei en troost">
      <section className="space-y-4">
        <div className="rounded-[1.75rem] border border-stone-200 bg-white px-4 py-4 shadow-sm">
          {user ? (
            <div className="grid gap-4 sm:grid-cols-[72px_1fr]">
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
            categories.map((category) => {
              const style = getCategoryStyle(category.slug);
              return (
              <Link
                key={category.id}
                href={`/content?category=${category.slug}`}
                className={`group flex h-full min-h-[260px] flex-col rounded-[1.5rem] p-3 text-center shadow-sm transition hover:-translate-y-0.5 ${style.cardClass}`}
              >
                <div className="relative mx-auto mb-3 h-20 w-20">
                  {category.featured_image_url ? (
                    <Image
                      src={category.featured_image_url}
                      alt={category.featured_image_alt || category.name}
                      width={80}
                      height={80}
                      unoptimized
                      className="h-20 w-20 rounded-full object-cover shadow-[0_10px_28px_rgba(18,20,26,0.14)]"
                    />
                  ) : (
                    <div
                      className={`h-20 w-20 rounded-full shadow-[0_10px_28px_rgba(18,20,26,0.14)] ${style.orbClass}`}
                    />
                  )}

                  <span className="absolute -right-1 -top-1 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg shadow-[0_6px_16px_rgba(18,20,26,0.16)]">
                    {style.badge}
                  </span>
                </div>

                <h3 className="min-h-[40px] text-base font-semibold leading-tight text-[#1f2f43]">
                  {category.name}
                </h3>

                <p className="mt-1 min-h-[40px] line-clamp-2 text-sm leading-5 text-[#31445c]">
                  {category.description || "Verken thema's en oefeningen binnen deze categorie."}
                </p>
                <div className="mt-auto pt-3">
                  <span className="inline-flex rounded-full border border-[#30445c33] bg-white/70 px-3 py-1 text-xs font-medium text-[#1f2f43]">
                    Open categorie
                  </span>
                </div>
              </Link>
            );
          })
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50 p-5 text-sm text-stone-600">
              Nog geen content beschikbaar.
            </div>
          )}
        </div>
      </section>
    </PublicAppShell>
  );
}
