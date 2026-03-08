import Link from "next/link";
import PublicAppShell from "@/components/public/PublicAppShell";
import AppLogoutButton from "@/components/account/AppLogoutButton";
import { login } from "@/components/login/actions";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import { createAdminClient } from "@/lib/supabase/admin";

type AccountSearchParams = {
  error?: string | string[];
};

type ProfileRow = {
  display_name: string | null;
  profile_data?: {
    first_name?: string | null;
    avatar_url?: string | null;
    profile_image?: string | null;
  } | null;
};

type WalletRow = {
  credits_available: number | null;
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

export default async function AccountPage({
  searchParams,
}: {
  searchParams?: Promise<AccountSearchParams>;
}) {
  const params = await searchParams;
  const error = Array.isArray(params?.error) ? params?.error[0] : params?.error;
  const hasInvalidError = error === "invalid";

  const user = await getCurrentUser();
  const supabase = createAdminClient();

  if (!user) {
    return (
      <PublicAppShell activeTab="profiel" title="Profiel" subtitle="Inloggen">
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
                href="/login"
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, profile_data")
    .eq("user_id", user.id)
    .maybeSingle<ProfileRow>();

  const { data: wallet } = await supabase
    .from("credit_wallets")
    .select("credits_available")
    .eq("user_id", user.id)
    .maybeSingle<WalletRow>();

  const displayName =
    profile?.display_name ??
    profile?.profile_data?.first_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0] ??
    "Gebruiker";
  const avatarUrl =
    profile?.profile_data?.avatar_url ??
    profile?.profile_data?.profile_image ??
    user.user_metadata?.avatar_url ??
    user.user_metadata?.picture ??
    "";

  return (
    <PublicAppShell activeTab="profiel" title="Profiel" subtitle="Mijn account">
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
            <p className="mt-2 text-center font-serif text-xl text-stone-900">
              {displayName}
            </p>
          </div>
        </div>

        <div className={accountCardClassName()}>
          <h3 className="mb-2 font-medium text-stone-900">Persoonlijke gegevens</h3>
          <ul className="space-y-2 text-sm text-stone-700">
            <li>E-mail: {user.email ?? "-"}</li>
            <li>Beschikbare credits: {wallet?.credits_available ?? 0}</li>
          </ul>
          <div className="mt-3">
            <Link
              href="/account?tab=profile"
              className="inline-flex rounded-full bg-white px-3 py-1.5 text-xs text-stone-800"
            >
              Wijzig gegevens
            </Link>
          </div>
        </div>

        <div className={accountCardClassName()}>
          <h3 className="mb-2 font-medium text-stone-900">Activiteiten & voortgang</h3>
          <div className="space-y-2 text-sm">
            <Link href="/content" className="block rounded-xl bg-white px-3 py-2">
              Mijn traject
            </Link>
            <Link href="/trainingen" className="block rounded-xl bg-white px-3 py-2">
              Voortgang
            </Link>
            <Link href="/therapeuten" className="block rounded-xl bg-white px-3 py-2">
              Therapeuten
            </Link>
            <Link href="/account?tab=unlocked" className="block rounded-xl bg-white px-3 py-2">
              Opgeslagen opdrachten
            </Link>
          </div>
        </div>

        <div className={accountCardClassName()}>
          <h3 className="mb-2 font-medium text-stone-900">Content & producten</h3>
          <div className="space-y-2 text-sm">
            <Link href="/shop" className="block rounded-xl bg-white px-3 py-2">
              Mijn aankopen
            </Link>
            <Link href="/shop" className="block rounded-xl bg-white px-3 py-2">
              Mijn downloads
            </Link>
            <Link href="/shop" className="block rounded-xl bg-white px-3 py-2">
              Mijn abonnementen
            </Link>
          </div>
        </div>

        <div className={accountCardClassName()}>
          <h3 className="mb-2 font-medium text-stone-900">Veiligheid & privacy</h3>
          <div className="space-y-2 text-sm">
            <Link href="/admin/settings/security" className="block rounded-xl bg-white px-3 py-2">
              Veiligheidsinstellingen
            </Link>
            <Link href="/account?tab=credits" className="block rounded-xl bg-white px-3 py-2">
              Logboek
            </Link>
          </div>
        </div>

        <div className="pb-2 pt-1">
          <AppLogoutButton />
        </div>
      </section>
    </PublicAppShell>
  );
}
