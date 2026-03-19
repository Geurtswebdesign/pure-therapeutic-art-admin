import Link from "next/link";
import PublicAppShell from "@/components/public/PublicAppShell";
import AppLogoutButton from "@/components/account/AppLogoutButton";
import AccountProfileForm from "@/components/account/AccountProfileForm";
import { login } from "@/components/login/actions";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { getAppMessages } from "@/lib/i18n/appMessages";
import { getPrimaryLanguage } from "@/lib/i18n/getPrimaryLanguage";
import { resolveUiLanguage } from "@/lib/i18n/runtime";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getTimedEntitlementSummary,
  THERAPIST_DIRECTORY_ENTITLEMENT_KEY,
} from "@/lib/users/entitlements";
import {
  type AppProfileData,
  getEffectiveAccountType,
  getProfileAccountType,
  getTherapistProfileData,
} from "@/lib/users/accountTypes";

type AccountSearchParams = {
  error?: string | string[];
  tab?: string | string[];
};

type ProfileRow = {
  display_name: string | null;
  role?: string | null;
  profile_data?: AppProfileData | null;
};

type WalletRow = {
  credits_available: number | null;
};

type LatestUnlockRow = {
  content_item_id: string | null;
  unlocked_at: string;
};

type ContentItemRow = {
  title: string | null;
  slug: string | null;
};

type TherapistEntitlementRow = {
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function accountCardClassName() {
  return "rounded-2xl border border-[#e5dbcf] bg-[#f7f0e9] p-3";
}

function labelForAccountType(
  accountType: "admin" | "user" | "client" | "therapist",
  t: ReturnType<typeof getAppMessages>["accountTabs"]
) {
  if (accountType === "therapist") return t.roleTherapist;
  if (accountType === "admin") return t.roleAdmin;
  if (accountType === "client") return t.roleClient;
  return t.roleUser;
}

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl bg-white px-3 py-3">
      <span className="text-sm text-stone-500">{label}</span>
      <span className="max-w-[65%] text-right text-sm text-stone-800">{value}</span>
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-xl bg-white px-3 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-stone-500">{label}</p>
      <p className="mt-2 text-lg font-medium text-stone-900">{value}</p>
      {detail ? <p className="mt-1 text-sm text-stone-500">{detail}</p> : null}
    </div>
  );
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams?: Promise<AccountSearchParams>;
}) {
  const language = resolveUiLanguage(await getPrimaryLanguage());
  const messages = getAppMessages(language);
  const tabsT = messages.accountTabs;
  const generalT = messages.userGeneral;
  const headerT = messages.userHeader;
  const creditsT = messages.userCredits;
  const locale =
    language === "en" ? "en-US" : language === "de" ? "de-DE" : "nl-NL";
  const params = await searchParams;
  const error = Array.isArray(params?.error) ? params?.error[0] : params?.error;
  const tab = Array.isArray(params?.tab) ? params?.tab[0] : params?.tab;
  const hasInvalidError = error === "invalid";
  const activeTab = tab === "profile" ? "profile" : "overview";

  const user = await getCurrentUser();
  const supabase = createAdminClient();

  if (!user) {
    return (
      <PublicAppShell activeTab="profiel">
        <section className="space-y-4">
          <div className="rounded-[1.75rem] border border-stone-200 bg-white p-5 shadow-sm">
            <h2 className="font-serif text-2xl text-stone-950">Welkom terug</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Log in om je profiel, voortgang en aankopen te bekijken.
            </p>
          </div>

          <form
            action={login}
            className="space-y-3 rounded-[1.5rem] border border-stone-200 bg-white p-4 shadow-sm"
          >
            <input type="hidden" name="next" value="/account" />
            <input type="hidden" name="origin" value="account" />

            <div>
              <label className="mb-1 block text-sm text-stone-700">E-mail</label>
              <input
                name="email"
                type="email"
                required
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#b64040]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-stone-700">
                Wachtwoord
              </label>
              <input
                name="password"
                type="password"
                required
                className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:border-[#b64040]"
              />
            </div>

            {hasInvalidError ? (
              <p className="text-sm text-red-600">
                Ongeldige inloggegevens. Probeer het opnieuw.
              </p>
            ) : null}

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="inline-flex rounded-full bg-[#b64040] px-4 py-2 text-sm font-medium text-white"
              >
                Inloggen
              </button>
              <Link
                href="/login?mode=register"
                className="inline-flex rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-800"
              >
                Aanmelden
              </Link>
            </div>
          </form>
        </section>
      </PublicAppShell>
    );
  }

  const [
    { data: profile },
    { data: wallet },
    { count: unlockedCount },
    { data: latestUnlock },
    { data: therapistEntitlements },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, role, profile_data")
      .eq("user_id", user.id)
      .maybeSingle<ProfileRow>(),
    supabase
      .from("credit_wallets")
      .select("credits_available")
      .eq("user_id", user.id)
      .maybeSingle<WalletRow>(),
    supabase
      .from("content_unlocks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("content_unlocks")
      .select("content_item_id, unlocked_at")
      .eq("user_id", user.id)
      .order("unlocked_at", { ascending: false })
      .limit(1)
      .maybeSingle<LatestUnlockRow>(),
    supabase
      .from("user_entitlements")
      .select("starts_at, ends_at, is_active, created_at")
      .eq("user_id", user.id)
      .eq("entitlement_key", THERAPIST_DIRECTORY_ENTITLEMENT_KEY)
      .order("created_at", { ascending: false })
      .returns<TherapistEntitlementRow[]>(),
  ]);

  let latestUnlockedContent: ContentItemRow | null = null;

  if (latestUnlock?.content_item_id) {
    const { data } = await supabase
      .from("content_items")
      .select("title, slug")
      .eq("id", latestUnlock.content_item_id)
      .maybeSingle<ContentItemRow>();
    latestUnlockedContent = data ?? null;
  }

  const firstName = profile?.profile_data?.first_name?.trim() ?? "";
  const lastName = profile?.profile_data?.last_name?.trim() ?? "";
  const website = profile?.profile_data?.website?.trim() ?? "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const displayName =
    profile?.display_name?.trim() ||
    fullName ||
    firstName ||
    (typeof user.user_metadata?.name === "string" ? user.user_metadata.name : "") ||
    user.email?.split("@")[0] ||
    "Gebruiker";
  const avatarUrl =
    profile?.profile_data?.avatar_url?.trim() ||
    profile?.profile_data?.profile_image ||
    (typeof user.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : "") ||
    (typeof user.user_metadata?.picture === "string"
      ? user.user_metadata.picture
      : "") ||
    "";
  const bio = profile?.profile_data?.bio?.trim() ?? "";
  const userAccountType = getProfileAccountType(profile?.profile_data ?? null);
  const therapistProfile = getTherapistProfileData(profile?.profile_data ?? null);
  const accountType = getEffectiveAccountType(
    profile?.role ??
      user.user_metadata?.role ??
      user.app_metadata?.role ??
      "user",
    profile?.profile_data ?? null
  );
  const memberSince = formatDate(user.created_at, locale);
  const lastUnlockedDate = formatDate(latestUnlock?.unlocked_at, locale);
  const safeUnlockedCount = unlockedCount ?? 0;
  const therapistSubscription = getTimedEntitlementSummary(
    therapistEntitlements ?? []
  );
  const therapistSubscriptionStatus =
    therapistSubscription.status === "active"
      ? creditsT.active
      : therapistSubscription.status === "planned"
        ? creditsT.planned
        : creditsT.ended;
  const therapistSubscriptionStart =
    therapistSubscription.current?.starts_at ??
    therapistSubscription.next?.starts_at ??
    null;
  const therapistSubscriptionActiveUntil =
    therapistSubscription.current?.ends_at
      ? formatDate(therapistSubscription.current.ends_at, locale)
      : therapistSubscription.current
        ? creditsT.indefinite
        : "-";
  const therapistSubscriptionRenewedUntil = therapistSubscription.hasOpenEnded
    ? creditsT.indefinite
    : therapistSubscription.latestRelevantEndAt
      ? formatDate(therapistSubscription.latestRelevantEndAt, locale)
      : creditsT.notScheduled;
  const therapistDirectoryVisible =
    userAccountType === "therapist" &&
    Boolean(therapistProfile.public_profile_enabled) &&
    therapistSubscription.status === "active";
  const showPublicDirectoryHint =
    userAccountType === "therapist" &&
    !therapistProfile.public_profile_enabled &&
    therapistSubscription.status !== "ended";

  return (
    <PublicAppShell activeTab="profiel">
      <section className="space-y-4">
        <div className="overflow-hidden rounded-[1.5rem] border border-[#d8c6b8] bg-[#d8e0d3]">
          <div className="px-4 py-4">
            <div className="flex items-center justify-center">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-16 w-16 rounded-full border border-white/80 object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#b64040] text-xl font-semibold text-white">
                  {getInitials(displayName)}
                </div>
              )}
            </div>
            <p className="mt-2 text-center text-xl text-stone-900">
              {displayName}
            </p>
            <p className="mt-1 text-center text-sm text-stone-600">
              {user.email ?? ""}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full bg-white/80 px-3 py-1 text-xs uppercase tracking-[0.18em] text-stone-700">
                {labelForAccountType(accountType, tabsT)}
              </span>
              <span className="rounded-full bg-white/60 px-3 py-1 text-xs text-stone-700">
                {headerT.createdAt}: {memberSince}
              </span>
            </div>
          </div>
        </div>

        {activeTab === "profile" ? (
          <>
            <AccountProfileForm
              userId={user.id}
              accountType={userAccountType}
              initialDisplayName={displayName}
              initialBio={bio}
              initialFirstName={firstName}
              initialLastName={lastName}
              initialWebsite={website}
              initialAvatarUrl={avatarUrl}
              initialTherapistProfile={therapistProfile}
              email={user.email ?? ""}
              language={language}
            />
          </>
        ) : (
          <>
            <div className={accountCardClassName()}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-medium text-stone-900">Mijn gegevens</h3>
                <Link
                  href="/account?tab=profile"
                  className="inline-flex rounded-full bg-white px-3 py-1.5 text-xs text-stone-800"
                >
                  {tabsT.profile}
                </Link>
              </div>
              <div className="mt-3 space-y-2">
                <DetailRow label={generalT.firstName} value={firstName || "-"} />
                <DetailRow label={generalT.lastName} value={lastName || "-"} />
                <DetailRow label={generalT.displayName} value={displayName} />
                <DetailRow label="E-mail" value={user.email ?? "-"} />
                <DetailRow label={generalT.website} value={website || "-"} />
              </div>
            </div>

            <div className={accountCardClassName()}>
              <h3 className="mb-3 font-medium text-stone-900">Mijn account</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <StatCard
                  label={tabsT.accountType}
                  value={labelForAccountType(accountType, tabsT)}
                />
                <StatCard
                  label={headerT.createdAt}
                  value={memberSince}
                />
                <StatCard
                  label={tabsT.availableCredits}
                  value={String(wallet?.credits_available ?? 0)}
                />
                <StatCard
                  label={tabsT.unlockedItems}
                  value={String(safeUnlockedCount)}
                />
              </div>
            </div>

            {userAccountType === "therapist" ? (
              <div className={accountCardClassName()}>
                <h3 className="mb-3 font-medium text-stone-900">
                  {creditsT.therapistSubTitle}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    label={creditsT.status}
                    value={therapistSubscriptionStatus}
                    detail={
                      therapistSubscriptionStart
                        ? `${creditsT.start}: ${formatDate(
                            therapistSubscriptionStart,
                            locale
                          )}`
                        : undefined
                    }
                  />
                  <StatCard
                    label={creditsT.activeUntil}
                    value={therapistSubscriptionActiveUntil}
                  />
                  <StatCard
                    label={creditsT.renewedUntil}
                    value={therapistSubscriptionRenewedUntil}
                  />
                  <StatCard
                    label={creditsT.directoryVisibility}
                    value={
                      therapistDirectoryVisible
                        ? creditsT.visibleInDirectory
                        : creditsT.hiddenInDirectory
                    }
                  />
                </div>
                {showPublicDirectoryHint ? (
                  <p className="mt-3 text-xs leading-5 text-stone-500">
                    {generalT.publicDirectoryHint}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className={accountCardClassName()}>
              <h3 className="mb-2 font-medium text-stone-900">Mijn voortgang</h3>
              <div className="rounded-xl bg-white px-3 py-3 text-sm text-stone-700">
                {latestUnlockedContent ? (
                  <>
                    <p className="font-medium text-stone-900">
                      Laatst ontgrendeld: {latestUnlockedContent.title ?? "Onbekende content"}
                    </p>
                    <p className="mt-1 text-stone-500">{lastUnlockedDate}</p>
                    {latestUnlockedContent.slug ? (
                      <Link
                        href={`/content/${latestUnlockedContent.slug}`}
                        className="mt-3 inline-flex rounded-full border border-stone-300 px-3 py-1.5 text-xs text-stone-800"
                      >
                        Verder lezen
                      </Link>
                    ) : null}
                  </>
                ) : (
                  <p>Nog geen ontgrendelde content beschikbaar.</p>
                )}
              </div>
            </div>

            <div className={accountCardClassName()}>
              <h3 className="mb-2 font-medium text-stone-900">Verder in de app</h3>
              <div className="space-y-2 text-sm">
                <Link href="/content" className="block rounded-xl bg-white px-3 py-2">
                  Bekijk content
                </Link>
                <Link href="/trainingen" className="block rounded-xl bg-white px-3 py-2">
                  Trainingen
                </Link>
                <Link href="/therapeuten" className="block rounded-xl bg-white px-3 py-2">
                  Therapeuten
                </Link>
                <Link href="/shop" className="block rounded-xl bg-white px-3 py-2">
                  Shop en aankopen
                </Link>
              </div>
            </div>

            <div className={accountCardClassName()}>
              <h3 className="mb-2 font-medium text-stone-900">Over mij</h3>
              {bio ? (
                <p className="rounded-xl bg-white px-3 py-3 text-sm leading-6 text-stone-700">
                  {bio}
                </p>
              ) : (
                <p className="rounded-xl bg-white px-3 py-3 text-sm leading-6 text-stone-500">
                  Voeg via je profiel een korte introductie toe.
                </p>
              )}
            </div>
          </>
        )}

        <div className="pb-2 pt-1">
          <AppLogoutButton />
        </div>
      </section>
    </PublicAppShell>
  );
}
