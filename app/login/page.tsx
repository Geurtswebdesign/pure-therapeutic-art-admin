import Image from "next/image";
import Link from "next/link";
import type { InputHTMLAttributes, ReactNode } from "react";
import { headers } from "next/headers";
import { ArrowLeft, HeartHandshake, ShieldCheck, Stethoscope } from "lucide-react";
import logo from "@/assets/branding/logo.png";
import { login, registerAccount, verifyMfa } from "@/components/login/actions";
import AdminTwoFactorCard from "@/components/admin/settings/AdminTwoFactorCard";
import { getLoginRateLimitMessage } from "@/lib/auth/getLoginRateLimitMessage";
import { getAppLanguage } from "@/lib/i18n/getAppLanguage";
import { resolveUiLanguage, type UiLanguage } from "@/lib/i18n/runtime";
import { getAppMessages } from "@/lib/i18n/appMessages";
import { getPublicBranding } from "@/lib/settings/public";
import { getActiveTherapistSubscriptionPacks } from "@/lib/users/therapistSubscriptionPacks";
import {
  getAdminAreaUrl,
  getPublicAreaUrl,
  getRequestHost,
  isAdminHost,
} from "@/lib/site/urls";

type LoginSearchParams = {
  step?: string | string[];
  error?: string | string[];
  minutes?: string | string[];
  next?: string | string[];
  mode?: string | string[];
  registered?: string | string[];
};

type AuthShellProps = {
  siteName: string;
  logoUrl: string | null;
  title: string;
  eyebrow: string;
  backLabel: string;
  backHref: string;
  maxWidthClassName?: string;
  children: ReactNode;
};

const AUTH_COPY: Record<
  UiLanguage,
  {
    eyebrow: string;
    backHome: string;
    loginIntro: string;
    adminLoginIntro: string;
    registerIntro: string;
    setupIntro: string;
    clientDescription: string;
    therapistDescription: string;
    registerHint: string;
    loginFailed: string;
    therapistPackTitle: string;
    therapistPackUnavailable: string;
    therapistPackError: string;
    monthlyPlan: string;
    yearlyPlan: string;
    monthlyDescription: string;
    yearlyDescription: string;
  }
> = {
  nl: {
    eyebrow: "Veilige toegang",
    backHome: "Terug naar home",
    loginIntro:
      "Log in om verder te gaan met je persoonlijke omgeving in de app.",
    adminLoginIntro:
      "Log in om verder te gaan naar de beheeromgeving van de app.",
    registerIntro:
      "Kies het account dat bij je past en maak een profiel aan in dezelfde stijl als de rest van de app.",
    setupIntro:
      "Beveilig je adminaccount voordat je verdergaat naar de beheeromgeving.",
    clientDescription:
      "Voor persoonlijke ondersteuning, opdrachten en aankopen in de app.",
    therapistDescription:
      "Voor professionals die de app inzetten en zichtbaar willen zijn als therapeut.",
    registerHint:
      "Na registratie kun je je profiel en aanvullende gegevens verder aanvullen in je account.",
    loginFailed: "Inloggen mislukt. Controleer je gegevens en probeer opnieuw.",
    therapistPackTitle: "Kies een therapeut-abonnement",
    therapistPackUnavailable:
      "Er zijn op dit moment geen actieve therapeut-abonnementen beschikbaar.",
    therapistPackError:
      "Het gekozen therapeut-abonnement is niet beschikbaar. Kies een actief pakket.",
    monthlyPlan: "Maandelijks",
    yearlyPlan: "Jaarlijks",
    monthlyDescription:
      "Geschikt als je eerst wilt starten met een kortere looptijd.",
    yearlyDescription:
      "Voor langdurige zichtbaarheid en gebruik binnen het therapeut-account.",
  },
  en: {
    eyebrow: "Secure access",
    backHome: "Back to home",
    loginIntro: "Log in to continue to your personal space in the app.",
    adminLoginIntro: "Log in to continue to the admin area of the app.",
    registerIntro:
      "Choose the account that fits you and create a profile in the same style as the rest of the app.",
    setupIntro:
      "Secure your admin account before continuing to the admin area.",
    clientDescription:
      "For personal support, assignments and purchases in the app.",
    therapistDescription:
      "For professionals who use the app and want to be visible as a therapist.",
    registerHint:
      "After registration you can complete your profile and add more details in your account.",
    loginFailed: "Login failed. Check your details and try again.",
    therapistPackTitle: "Choose a therapist subscription",
    therapistPackUnavailable:
      "There are currently no active therapist subscriptions available.",
    therapistPackError:
      "The selected therapist subscription is unavailable. Choose an active plan.",
    monthlyPlan: "Monthly",
    yearlyPlan: "Yearly",
    monthlyDescription:
      "A good fit if you want to start with a shorter term first.",
    yearlyDescription:
      "For longer-term visibility and use within the therapist account.",
  },
  de: {
    eyebrow: "Sicherer Zugang",
    backHome: "Zuruck zur Startseite",
    loginIntro:
      "Melde dich an, um mit deinem persoenlichen Bereich in der App fortzufahren.",
    adminLoginIntro:
      "Melde dich an, um mit dem Adminbereich der App fortzufahren.",
    registerIntro:
      "Wahle das passende Konto und erstelle ein Profil im gleichen Stil wie der Rest der App.",
    setupIntro:
      "Sichere dein Admin-Konto, bevor du zum Adminbereich weitergehst.",
    clientDescription:
      "Fur persoenliche Unterstutzung, Aufgaben und Einkaufe in der App.",
    therapistDescription:
      "Fur Fachpersonen, die die App nutzen und als Therapeut sichtbar sein wollen.",
    registerHint:
      "Nach der Registrierung kannst du dein Profil und weitere Angaben in deinem Konto ergaenzen.",
    loginFailed:
      "Anmeldung fehlgeschlagen. Bitte pruefe deine Angaben und versuche es erneut.",
    therapistPackTitle: "Therapeuten-Abo waehlen",
    therapistPackUnavailable:
      "Aktuell sind keine aktiven Therapeuten-Abonnements verfuegbar.",
    therapistPackError:
      "Das gewaehlte Therapeuten-Abonnement ist nicht verfuegbar. Bitte waehle ein aktives Paket.",
    monthlyPlan: "Monatlich",
    yearlyPlan: "Jaehrlich",
    monthlyDescription:
      "Geeignet, wenn du zuerst mit einer kuerzeren Laufzeit starten moechtest.",
    yearlyDescription:
      "Fuer laengere Sichtbarkeit und Nutzung innerhalb des Therapeutenkontos.",
  },
};

function formatMoney(amountCents: number, currency = "EUR") {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountCents / 100);
}

function AuthShell({
  siteName,
  logoUrl,
  title,
  eyebrow,
  backLabel,
  backHref,
  maxWidthClassName = "max-w-md",
  children,
}: AuthShellProps) {
  return (
    <div className="min-h-[100svh] min-h-[100dvh] bg-[linear-gradient(180deg,#f3e4d9_0%,#efe5dc_26%,#f7f2ec_64%,#f9f7f3_100%)] px-3 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-[calc(env(safe-area-inset-top,0px)+1rem)] sm:px-6 sm:pb-6 sm:pt-6">
      <div className={`mx-auto w-full ${maxWidthClassName}`}>
        <div className="overflow-hidden rounded-[2rem] border border-stone-300/70 bg-[linear-gradient(180deg,#fdfaf6_0%,#faf4ed_52%,#f7f1ea_100%)] shadow-[0_30px_80px_rgba(49,34,25,0.18)]">
          <header className="border-b border-stone-200/80 px-5 pb-5 pt-5">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={`${siteName} logo`}
                    fill
                    sizes="48px"
                    unoptimized
                    className="object-contain"
                  />
                ) : (
                  <Image
                    src={logo}
                    alt={siteName}
                    fill
                    sizes="48px"
                    className="object-contain"
                    priority
                  />
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate text-xl leading-tight text-stone-900">
                  {siteName}
                </div>
                <div className="truncate text-xs uppercase tracking-[0.22em] text-stone-500">
                  {eyebrow}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-start justify-between gap-3">
              <h1 className="font-serif text-3xl leading-tight text-stone-950">
                {title}
              </h1>
              <Link
                href={backHref}
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#decfbe] bg-white/80 px-3 py-2 text-xs font-medium text-stone-700 shadow-sm"
              >
                <ArrowLeft size={14} strokeWidth={1.8} />
                {backLabel}
              </Link>
            </div>
          </header>

          <div className="px-4 py-5 sm:px-5 sm:py-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-medium text-stone-700">{label}</span>
      {children}
    </label>
  );
}

function AuthInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-[1rem] border border-[#d9cbbb] bg-white px-3 py-3 text-base text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-[#c68567] focus:ring-2 focus:ring-[#ecd2c2] sm:text-sm"
    />
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<LoginSearchParams>;
}) {
  const language = resolveUiLanguage(await getAppLanguage());
  const t = getAppMessages(language).login;
  const copy = AUTH_COPY[language];
  const branding = await getPublicBranding();
  const therapistPacks = await getActiveTherapistSubscriptionPacks();
  const params = await searchParams;
  const requestHeaders = await headers();
  const adminRequestHost = isAdminHost(getRequestHost(requestHeaders));
  const step = Array.isArray(params?.step) ? params?.step[0] : params?.step;
  const error = Array.isArray(params?.error) ? params?.error[0] : params?.error;
  const minutesParam = Array.isArray(params?.minutes)
    ? params?.minutes[0]
    : params?.minutes;
  const next = Array.isArray(params?.next) ? params?.next[0] : params?.next;
  const mode = Array.isArray(params?.mode) ? params?.mode[0] : params?.mode;
  const registered = Array.isArray(params?.registered)
    ? params?.registered[0]
    : params?.registered;
  const isMfaStep = step === "mfa";
  const isMfaSetup = step === "mfa-setup";
  const hasMfaError = error === "invalid";
  const isRegisterMode = !adminRequestHost && mode === "register";
  const hasLoginError = error === "invalid";
  const hasRateLimitError = error === "rate-limit";
  const rateLimitMinutes = Number.parseInt(minutesParam ?? "", 10);
  const hasRegisterError = error === "register";
  const hasTherapistPackError = error === "therapist-pack";
  const registrationSucceeded = registered === "1";
  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";
  const registerHref = next
    ? `/login?mode=register&next=${encodeURIComponent(next)}`
    : "/login?mode=register";
  const therapistRegistrationAvailable = therapistPacks.length > 0;
  const defaultTherapistPlan = therapistPacks[0]?.plan ?? "monthly";
  const backHref = getPublicAreaUrl("/");
  const loginRateLimitMessage = getLoginRateLimitMessage(
    language,
    Number.isFinite(rateLimitMinutes) ? rateLimitMinutes : null
  );

  if (isMfaStep) {
    return (
      <AuthShell
        siteName={branding.siteName}
        logoUrl={branding.logoUrl}
        title={t.mfaTitle}
        eyebrow={copy.eyebrow}
        backLabel={copy.backHome}
        backHref={backHref}
      >
        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-[#e5d8ca] bg-white/85 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-[#6f5949]">
              <ShieldCheck size={18} strokeWidth={1.8} />
              <span className="text-xs font-medium uppercase tracking-[0.22em] text-[#6f5949]">
                2FA
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#6b5d50]">
              {t.mfaPrompt}
            </p>
          </div>

          <form
            action={verifyMfa}
            className="space-y-4 rounded-[1.5rem] border border-[#e5d8ca] bg-white/90 p-4 shadow-sm"
          >
            <FormField label={t.mfaCode}>
              <AuthInput
                name="code"
                type="text"
                inputMode="numeric"
                required
                autoComplete="one-time-code"
              />
            </FormField>

            {hasMfaError ? (
              <p className="rounded-[1rem] border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {t.mfaInvalid}
              </p>
            ) : null}

            <button
              type="submit"
              className="w-full rounded-full bg-[#b64040] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#9e3a3a]"
            >
              {t.mfaSubmit}
            </button>
          </form>
        </div>
      </AuthShell>
    );
  }

  if (isMfaSetup) {
    return (
      <AuthShell
        siteName={branding.siteName}
        logoUrl={branding.logoUrl}
        title={t.mfaTitle}
        eyebrow={copy.eyebrow}
        backLabel={copy.backHome}
        backHref={backHref}
        maxWidthClassName="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-[#e5d8ca] bg-white/85 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-[#6f5949]">
              <ShieldCheck size={18} strokeWidth={1.8} />
              <span className="text-xs font-medium uppercase tracking-[0.22em] text-[#6f5949]">
                Beveiliging
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#6b5d50]">
              {copy.setupIntro}
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm">
            {t.mfaSetupPrompt}
          </div>

          <AdminTwoFactorCard language={language} />

          <div className="flex justify-end">
            <Link
              href={getAdminAreaUrl("/")}
              className="inline-flex items-center rounded-full bg-[#1d2327] px-4 py-2.5 text-sm font-medium text-white"
            >
              {t.mfaSetupContinue}
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      siteName={branding.siteName}
      logoUrl={branding.logoUrl}
      title={isRegisterMode ? t.registerTitle : t.title}
      eyebrow={copy.eyebrow}
      backLabel={copy.backHome}
      backHref={backHref}
    >
      <section className="space-y-4">
        <div className="rounded-[1.5rem] border border-[#e5d8ca] bg-white/85 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-[#6f5949]">
            <ShieldCheck size={18} strokeWidth={1.8} />
            <span className="text-xs font-medium uppercase tracking-[0.22em] text-[#6f5949]">
              {isRegisterMode ? t.modeRegister : t.modeLogin}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#6b5d50]">
            {adminRequestHost
              ? copy.adminLoginIntro
              : isRegisterMode
                ? copy.registerIntro
                : copy.loginIntro}
          </p>
        </div>

        {adminRequestHost ? null : (
          <div className="grid grid-cols-2 gap-2 rounded-[1.4rem] border border-[#e2d7c9] bg-[#f6efe8] p-2 shadow-sm">
            <Link
              href={loginHref}
              className={`rounded-full px-4 py-2.5 text-center text-sm font-medium transition ${
                isRegisterMode
                  ? "text-stone-700"
                  : "bg-[#1d2327] text-white shadow-sm"
              }`}
            >
              {t.modeLogin}
            </Link>
            <Link
              href={registerHref}
              className={`rounded-full px-4 py-2.5 text-center text-sm font-medium transition ${
                isRegisterMode
                  ? "bg-[#1d2327] text-white shadow-sm"
                  : "text-stone-700"
              }`}
            >
              {t.modeRegister}
            </Link>
          </div>
        )}

        {!adminRequestHost && registrationSucceeded ? (
          <p className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">
            {t.registerSuccess}
          </p>
        ) : null}

        {isRegisterMode ? (
          <form
            action={registerAccount}
            className="space-y-4 rounded-[1.5rem] border border-[#e5d8ca] bg-white/90 p-4 shadow-sm"
          >
            <input type="hidden" name="next" value={next || "/account"} />

            <div className="grid grid-cols-2 gap-3">
              <FormField label={t.firstName}>
                <AuthInput name="first_name" type="text" required />
              </FormField>
              <FormField label={t.lastName}>
                <AuthInput name="last_name" type="text" required />
              </FormField>
            </div>

            <FormField label={t.email}>
              <AuthInput
                name="email"
                type="email"
                required
                autoComplete="email"
              />
            </FormField>

            <FormField label={t.password}>
              <AuthInput
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </FormField>

            <div className="space-y-2">
              <span className="block text-sm font-medium text-stone-700">
                {t.accountType}
              </span>
              <input
                id="register-account-client"
                type="radio"
                name="account_type"
                value="client"
                defaultChecked
                className="peer/client sr-only"
              />
              <input
                id="register-account-therapist"
                type="radio"
                name="account_type"
                value="therapist"
                disabled={!therapistRegistrationAvailable}
                className="peer/therapist sr-only"
              />
              <div className="grid gap-3">
                <label
                  htmlFor="register-account-client"
                  className="block cursor-pointer"
                >
                  <span className="flex rounded-[1.25rem] border border-[#e5d8ca] bg-[#fffaf6] p-4 shadow-sm transition peer-checked/client:border-[#b46b52] peer-checked/client:bg-[#fff2ea] peer-checked/client:shadow-[0_10px_24px_rgba(83,54,36,0.12)]">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f6e7dc] text-[#9a5b43]">
                      <HeartHandshake size={20} strokeWidth={1.8} />
                    </span>
                    <span className="ml-3 block">
                      <span className="block text-sm font-semibold text-stone-950">
                        {t.accountTypeClient}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-[#6b5d50]">
                        {copy.clientDescription}
                      </span>
                    </span>
                  </span>
                </label>

                <label
                  htmlFor={
                    therapistRegistrationAvailable
                      ? "register-account-therapist"
                      : undefined
                  }
                  className={`block ${
                    therapistRegistrationAvailable
                      ? "cursor-pointer"
                      : "cursor-not-allowed"
                  }`}
                >
                  <span
                    className={`flex rounded-[1.25rem] border p-4 shadow-sm transition ${
                      therapistRegistrationAvailable
                        ? "border-[#e5d8ca] bg-[#fffaf6] peer-checked/therapist:border-[#b46b52] peer-checked/therapist:bg-[#fff2ea] peer-checked/therapist:shadow-[0_10px_24px_rgba(83,54,36,0.12)]"
                        : "border-[#eadfce] bg-[#f8f2eb] opacity-60"
                    }`}
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f6e7dc] text-[#9a5b43]">
                      <Stethoscope size={20} strokeWidth={1.8} />
                    </span>
                    <span className="ml-3 block">
                      <span className="block text-sm font-semibold text-stone-950">
                        {t.accountTypeTherapist}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-[#6b5d50]">
                        {therapistRegistrationAvailable
                          ? copy.therapistDescription
                          : copy.therapistPackUnavailable}
                      </span>
                    </span>
                  </span>
                </label>
              </div>

              {therapistRegistrationAvailable ? (
                <div className="hidden rounded-[1.25rem] border border-[#e5d8ca] bg-[#fffaf6] p-4 shadow-sm peer-checked/therapist:block">
                  <div className="flex items-center gap-2 text-[#6f5949]">
                    <ShieldCheck size={16} strokeWidth={1.8} />
                    <span className="text-xs font-medium uppercase tracking-[0.22em] text-[#6f5949]">
                      {copy.therapistPackTitle}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-3">
                    {therapistPacks.map((pack, index) => (
                      <label key={pack.id} className="block cursor-pointer">
                        <input
                          type="radio"
                          name="therapist_plan"
                          value={pack.plan}
                          defaultChecked={
                            pack.plan === defaultTherapistPlan && index === 0
                          }
                          className="peer sr-only"
                        />
                        <span className="flex rounded-[1.1rem] border border-[#e5d8ca] bg-white p-4 shadow-sm transition peer-checked:border-[#b46b52] peer-checked:bg-[#fff2ea] peer-checked:shadow-[0_10px_24px_rgba(83,54,36,0.12)]">
                          <span className="block flex-1">
                            <span className="block text-sm font-semibold text-stone-950">
                              {pack.name}
                            </span>
                            <span className="mt-1 block text-xs uppercase tracking-[0.18em] text-[#8a5f49]">
                              {pack.plan === "monthly"
                                ? copy.monthlyPlan
                                : copy.yearlyPlan}
                            </span>
                            <span className="mt-2 block text-xs leading-5 text-[#6b5d50]">
                              {pack.plan === "monthly"
                                ? copy.monthlyDescription
                                : copy.yearlyDescription}
                            </span>
                          </span>
                          <span className="ml-4 shrink-0 text-right">
                            <span className="block text-base font-semibold text-stone-950">
                              {formatMoney(pack.price_cents, pack.currency)}
                            </span>
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {hasRegisterError || hasTherapistPackError ? (
              <p className="rounded-[1rem] border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {hasTherapistPackError
                  ? copy.therapistPackError
                  : t.registerFailed}
              </p>
            ) : null}

            <button
              type="submit"
              className="w-full rounded-full bg-[#b64040] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#9e3a3a]"
            >
              {t.registerSubmit}
            </button>

            <p className="text-sm leading-6 text-[#6b5d50]">
              {copy.registerHint}
            </p>
          </form>
        ) : (
          <form
            action={login}
            className="space-y-4 rounded-[1.5rem] border border-[#e5d8ca] bg-white/90 p-4 shadow-sm"
          >
            <input type="hidden" name="next" value={next || "/account"} />
            <input type="hidden" name="origin" value="login" />

            <FormField label={t.email}>
              <AuthInput
                name="email"
                type="email"
                required
                autoComplete="email"
              />
            </FormField>

            <FormField label={t.password}>
              <AuthInput
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </FormField>

            {hasLoginError ? (
              <p className="rounded-[1rem] border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {copy.loginFailed}
              </p>
            ) : null}
            {hasRateLimitError ? (
              <p className="rounded-[1rem] border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {loginRateLimitMessage}
              </p>
            ) : null}

            <button
              type="submit"
              className="w-full rounded-full bg-[#1d2327] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#2b3439]"
            >
              {t.submit}
            </button>
          </form>
        )}
      </section>
    </AuthShell>
  );
}
