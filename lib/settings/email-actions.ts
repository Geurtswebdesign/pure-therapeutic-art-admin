"use server";

import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/auth/getAdminUser";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTransactionalEmail } from "@/lib/mail/service";
import {
  EMAIL_TEMPLATE_TYPES,
  EMAIL_SENDER_KEYS,
  type EmailSenderKey,
  type EmailSenderProfile,
  type EmailBrandingSettings,
  type EmailTemplateType,
} from "@/lib/mail/types";

type EmailTemplateAdminRow = {
  id: string;
  type: EmailTemplateType;
  sender_key: EmailSenderKey;
  subject: string;
  html: string;
  is_active: boolean;
  updated_at: string;
};

type EmailLogRow = {
  id: string;
  template_type: string | null;
  recipient: string;
  subject: string;
  status: string;
  error_message: string | null;
  created_at: string;
};

type EmailSettingsAdminData = {
  smtp: {
    hasClientId: boolean;
    hasClientSecret: boolean;
    hasRefreshToken: boolean;
    hasSenderEmail: boolean;
    hasAllowedSenderEmails: boolean;
  };
  templates: EmailTemplateAdminRow[];
  senderProfiles: EmailSenderProfile[];
  branding: EmailBrandingSettings & { id: string };
  logs: EmailLogRow[];
};

function assertAdmin(
  user: Awaited<ReturnType<typeof getAdminUser>>
): asserts user is NonNullable<Awaited<ReturnType<typeof getAdminUser>>> {
  if (!user) throw new Error("Niet geautoriseerd");
}

const DEFAULT_BRANDING: EmailBrandingSettings & { id: string } = {
  id: "default",
  app_name: "Pure Therapeutic ART Therapy",
  primary_color: "#111827",
  logo_url: null,
  support_email: null,
  footer_text: "© Pure Therapeutic ART Therapy",
  website_url: null,
};

export async function getEmailSettingsAdminData(): Promise<EmailSettingsAdminData> {
  const admin = await getAdminUser();
  assertAdmin(admin);

  const supabase = createAdminClient();

  const [
    { data: templates, error: templatesError },
    { data: senderProfiles, error: senderProfilesError },
    { data: branding, error: brandingError },
    { data: logs, error: logsError },
  ] =
    await Promise.all([
      supabase
        .from("email_templates")
        .select("id, type, sender_key, subject, html, is_active, updated_at")
        .order("type", { ascending: true })
        .returns<EmailTemplateAdminRow[]>(),
      supabase
        .from("email_sender_profiles")
        .select("id, key, name, email, reply_to, is_active")
        .order("key", { ascending: true })
        .returns<EmailSenderProfile[]>(),
      supabase
        .from("email_branding_settings")
        .select("id, app_name, primary_color, logo_url, support_email, footer_text, website_url")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle<EmailBrandingSettings & { id: string }>(),
      supabase
        .from("email_logs")
        .select("id, template_type, recipient, subject, status, error_message, created_at")
        .order("created_at", { ascending: false })
        .limit(30)
        .returns<EmailLogRow[]>(),
    ]);

  if (templatesError) throw new Error(templatesError.message);
  if (senderProfilesError) throw new Error(senderProfilesError.message);
  if (brandingError) throw new Error(brandingError.message);
  if (logsError) throw new Error(logsError.message);

  return {
    smtp: {
      hasClientId: Boolean(process.env.GOOGLE_CLIENT_ID),
      hasClientSecret: Boolean(process.env.GOOGLE_CLIENT_SECRET),
      hasRefreshToken: Boolean(process.env.GOOGLE_REFRESH_TOKEN),
      hasSenderEmail: Boolean(process.env.GOOGLE_SENDER_EMAIL),
      hasAllowedSenderEmails: Boolean(process.env.GOOGLE_ALLOWED_SENDER_EMAILS),
    },
    templates: templates ?? [],
    senderProfiles: senderProfiles ?? [],
    branding: branding ?? DEFAULT_BRANDING,
    logs: logs ?? [],
  };
}

export async function saveEmailTemplate(input: {
  type: EmailTemplateType;
  senderKey: EmailSenderKey;
  subject: string;
  html: string;
  isActive: boolean;
}) {
  const admin = await getAdminUser();
  assertAdmin(admin);

  if (!EMAIL_TEMPLATE_TYPES.includes(input.type)) {
    throw new Error("Ongeldig template type.");
  }
  if (!EMAIL_SENDER_KEYS.includes(input.senderKey)) {
    throw new Error("Ongeldige afzender.");
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("email_templates").upsert(
    {
      type: input.type,
      sender_key: input.senderKey,
      subject: input.subject.trim(),
      html: input.html.trim(),
      is_active: input.isActive,
      updated_by: admin.id,
    },
    { onConflict: "type" }
  );

  if (error) throw new Error(error.message);
  revalidatePath("/admin/settings/email");
}

export async function saveEmailSenderProfiles(
  input: Array<{
    key: EmailSenderKey;
    name: string;
    email?: string;
    replyTo?: string;
    isActive: boolean;
  }>
) {
  const admin = await getAdminUser();
  assertAdmin(admin);

  if (!input.length) return;
  const payload = input.map((row) => {
    if (!EMAIL_SENDER_KEYS.includes(row.key)) {
      throw new Error(`Ongeldige afzender key: ${row.key}`);
    }
    const normalizedEmail = row.email?.trim().toLowerCase() || "";
    if (row.isActive && !normalizedEmail) {
      throw new Error(`Vul een e-mailadres in voor actief afzenderprofiel '${row.key}'.`);
    }
    if (normalizedEmail && !normalizedEmail.includes("@")) {
      throw new Error(`Ongeldig e-mailadres voor afzenderprofiel '${row.key}'.`);
    }
    return {
      key: row.key,
      name: row.name.trim() || row.key,
      email: normalizedEmail || null,
      reply_to: row.replyTo?.trim() || null,
      is_active: row.isActive,
      updated_by: admin.id,
    };
  });

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("email_sender_profiles")
    .upsert(payload, { onConflict: "key" });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/settings/email");
}

export async function saveEmailBranding(input: {
  appName: string;
  primaryColor: string;
  logoUrl?: string;
  supportEmail?: string;
  footerText?: string;
  websiteUrl?: string;
}) {
  const admin = await getAdminUser();
  assertAdmin(admin);

  const supabase = createAdminClient();
  const { data: existing, error: existingError } = await supabase
    .from("email_branding_settings")
    .select("id")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (existingError) throw new Error(existingError.message);

  const payload = {
    app_name: input.appName.trim() || DEFAULT_BRANDING.app_name,
    primary_color: input.primaryColor.trim() || DEFAULT_BRANDING.primary_color,
    logo_url: input.logoUrl?.trim() || null,
    support_email: input.supportEmail?.trim() || null,
    footer_text: input.footerText?.trim() || null,
    website_url: input.websiteUrl?.trim() || null,
    updated_by: admin.id,
  };

  const { error } = existing
    ? await supabase
        .from("email_branding_settings")
        .update(payload)
        .eq("id", existing.id)
    : await supabase.from("email_branding_settings").insert(payload);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/settings/email");
}

export async function sendEmailSettingsTest(input: {
  to: string;
  templateType: EmailTemplateType;
}) {
  const admin = await getAdminUser();
  assertAdmin(admin);

  const recipient = input.to.trim().toLowerCase();
  if (!recipient || !recipient.includes("@")) {
    throw new Error("Vul een geldig test e-mailadres in.");
  }

  await sendTransactionalEmail({
    templateType: input.templateType,
    to: recipient,
    variables: {
      user_name: "Test gebruiker",
      content_title: "Voorbeeldcontent",
      unlock_date: new Date().toISOString(),
      remaining_credits: "10",
      reminder_text: "Dit is een testherinnering.",
      action_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/account`,
      app_url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    },
  });

  revalidatePath("/admin/settings/email");
}
