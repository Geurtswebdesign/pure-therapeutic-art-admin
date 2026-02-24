"use server";

import nodemailer from "nodemailer";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/auth/getAdminUser";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_EMAIL_SETTINGS,
  type EmailSettings,
} from "@/lib/settings/email-types";

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function assertAdmin(
  user: Awaited<ReturnType<typeof getAdminUser>>
): asserts user is NonNullable<Awaited<ReturnType<typeof getAdminUser>>> {
  if (!user) {
    throw new Error("Niet geautoriseerd");
  }
}

type StoredEmailSettings = {
  fromName: string;
  fromEmail: string;
  replyTo: string;
  gmailUser: string;
  googleClientId: string;
  googleClientSecret: string;
  googleRefreshToken: string;
};

async function getStoredEmailSettings() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("id, value")
    .eq("scope", "global")
    .is("scope_id", null)
    .eq("key", "email")
    .maybeSingle<{ id: string; value: unknown }>();

  if (error) {
    throw new Error(error.message);
  }

  const value = asObject(data?.value);

  const settings: StoredEmailSettings = {
    fromName: asString(value?.fromName, DEFAULT_EMAIL_SETTINGS.fromName),
    fromEmail: asString(value?.fromEmail, DEFAULT_EMAIL_SETTINGS.fromEmail),
    replyTo: asString(value?.replyTo, DEFAULT_EMAIL_SETTINGS.replyTo),
    gmailUser: asString(value?.gmailUser, DEFAULT_EMAIL_SETTINGS.gmailUser),
    googleClientId: asString(value?.googleClientId, ""),
    googleClientSecret: asString(value?.googleClientSecret, ""),
    googleRefreshToken: asString(value?.googleRefreshToken, ""),
  };

  return {
    id: data?.id ?? null,
    settings,
  };
}

export async function getEmailSettings(): Promise<EmailSettings> {
  const admin = await getAdminUser();
  assertAdmin(admin);

  const { settings } = await getStoredEmailSettings();
  return {
    fromName: settings.fromName,
    fromEmail: settings.fromEmail,
    replyTo: settings.replyTo,
    gmailUser: settings.gmailUser,
    googleClientId: settings.googleClientId,
    googleClientSecret: "",
    googleRefreshToken: "",
    hasClientSecret: Boolean(settings.googleClientSecret),
    hasRefreshToken: Boolean(settings.googleRefreshToken),
  };
}

export async function saveEmailSettings(input: EmailSettings) {
  const admin = await getAdminUser();
  assertAdmin(admin);

  const { id: existingId, settings: existing } = await getStoredEmailSettings();
  const gmailUser = input.gmailUser.trim();
  const fromName = input.fromName.trim() || DEFAULT_EMAIL_SETTINGS.fromName;
  const fromEmail = input.fromEmail.trim();
  const replyTo = input.replyTo.trim();
  const googleClientId = input.googleClientId.trim();
  const nextClientSecret =
    input.googleClientSecret.trim() || existing.googleClientSecret;
  const nextRefreshToken =
    input.googleRefreshToken.trim() || existing.googleRefreshToken;

  const value = {
    fromName,
    fromEmail,
    replyTo,
    gmailUser,
    googleClientId,
    googleClientSecret: nextClientSecret,
    googleRefreshToken: nextRefreshToken,
  };

  const supabase = createAdminClient();
  const { error } = existingId
    ? await supabase
        .from("app_settings")
        .update({
          value,
          updated_by: admin.id,
        })
        .eq("id", existingId)
    : await supabase.from("app_settings").insert({
        scope: "global",
        scope_id: null,
        key: "email",
        value,
        updated_by: admin.id,
      });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/settings/email");
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function sendEmailSettingsTest(testRecipient: string) {
  const admin = await getAdminUser();
  assertAdmin(admin);

  const to = testRecipient.trim().toLowerCase();
  if (!isValidEmail(to)) {
    throw new Error("Vul een geldig test e-mailadres in.");
  }

  const { settings } = await getStoredEmailSettings();
  if (
    !settings.gmailUser ||
    !settings.googleClientId ||
    !settings.googleClientSecret ||
    !settings.googleRefreshToken
  ) {
    throw new Error(
      "Gmail gebruiker, Google Client ID, Client Secret en Refresh Token zijn verplicht."
    );
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: settings.gmailUser,
      clientId: settings.googleClientId,
      clientSecret: settings.googleClientSecret,
      refreshToken: settings.googleRefreshToken,
    },
  });

  await transporter.sendMail({
    from: settings.fromEmail
      ? `"${settings.fromName}" <${settings.fromEmail}>`
      : settings.gmailUser,
    replyTo: settings.replyTo || undefined,
    to,
    subject: "Pure Therapeutic ART - Google Workspace SMTP test",
    text: "Deze testmail bevestigt dat Google Workspace SMTP OAuth2 correct is ingesteld.",
    html: "<p>Deze testmail bevestigt dat <strong>Google Workspace SMTP OAuth2</strong> correct is ingesteld.</p>",
  });
}
