import { createAdminClient } from "@/lib/supabase/admin";
import { renderTemplate } from "@/lib/mail/renderTemplate";
import { sendMail } from "@/lib/mail/sendMail";
import type {
  EmailBrandingSettings,
  EmailSenderProfile,
  EmailTemplateType,
} from "@/lib/mail/types";

type EmailTemplateRow = {
  type: EmailTemplateType;
  sender_key: string;
  subject: string;
  html: string;
  is_active: boolean;
};

const DEFAULT_BRANDING: EmailBrandingSettings = {
  app_name: "Pure Therapeutic ART Therapy",
  primary_color: "#111827",
  logo_url: null,
  support_email: null,
  footer_text: null,
  website_url: null,
};

function asRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  const entries = Object.entries(value as Record<string, unknown>);
  return entries.reduce<Record<string, string>>((acc, [key, val]) => {
    acc[key] = typeof val === "string" ? val : String(val ?? "");
    return acc;
  }, {});
}

export async function getEmailTemplate(type: EmailTemplateType) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("email_templates")
    .select("type, sender_key, subject, html, is_active")
    .eq("type", type)
    .maybeSingle<EmailTemplateRow>();

  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function getEmailSenderProfile(senderKey: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("email_sender_profiles")
    .select("id, key, name, email, reply_to, is_active")
    .eq("key", senderKey)
    .maybeSingle<EmailSenderProfile>();

  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function getEmailBrandingSettings() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("email_branding_settings")
    .select("app_name, primary_color, logo_url, support_email, footer_text, website_url")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle<EmailBrandingSettings>();

  if (error) throw new Error(error.message);
  return data ?? DEFAULT_BRANDING;
}

async function insertEmailLog(input: {
  templateType?: EmailTemplateType;
  recipient: string;
  subject: string;
  status: "queued" | "sent" | "failed";
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createAdminClient();
  await supabase.from("email_logs").insert({
    template_type: input.templateType ?? null,
    recipient: input.recipient,
    subject: input.subject,
    status: input.status,
    provider: "google_oauth2",
    error_message: input.errorMessage ?? null,
    metadata: input.metadata ?? {},
    sent_at: input.status === "sent" ? new Date().toISOString() : null,
  });
}

export async function sendTransactionalEmail(input: {
  templateType: EmailTemplateType;
  to: string;
  variables?: Record<string, unknown>;
}) {
  const template = await getEmailTemplate(input.templateType);
  if (!template || !template.is_active) {
    throw new Error(`Actieve e-mailtemplate ontbreekt voor type: ${input.templateType}`);
  }

  const branding = await getEmailBrandingSettings();
  const vars = asRecord(input.variables);
  const merged = {
    ...vars,
    app_name: vars.app_name ?? branding.app_name,
    primary_color: vars.primary_color ?? branding.primary_color,
    logo_url: vars.logo_url ?? (branding.logo_url ?? ""),
    support_email: vars.support_email ?? (branding.support_email ?? ""),
    footer_text: vars.footer_text ?? (branding.footer_text ?? ""),
    website_url: vars.website_url ?? (branding.website_url ?? ""),
  };

  const subject = renderTemplate(template.subject, merged);
  const html = renderTemplate(template.html, merged);
  const sender = await getEmailSenderProfile(template.sender_key);
  if (sender && !sender.is_active) {
    throw new Error(`Afzenderprofiel '${template.sender_key}' is niet actief.`);
  }
  if (!sender) {
    throw new Error(`Afzenderprofiel '${template.sender_key}' bestaat niet.`);
  }
  if (!sender.email?.trim()) {
    throw new Error(
      `Afzenderprofiel '${template.sender_key}' heeft geen e-mailadres. Vul dit in bij Settings > Email > Afzenders.`
    );
  }
  const senderName = sender?.name || branding.app_name;
  const senderEmail = sender.email.trim();
  const replyTo = sender?.reply_to || branding.support_email || undefined;

  await insertEmailLog({
    templateType: input.templateType,
    recipient: input.to,
    subject,
    status: "queued",
    metadata: { template_type: input.templateType },
  });

  try {
    await sendMail({
      to: input.to,
      subject,
      html,
      fromName: senderName,
      fromEmail: senderEmail,
      replyTo,
    });

    await insertEmailLog({
      templateType: input.templateType,
      recipient: input.to,
      subject,
      status: "sent",
      metadata: { template_type: input.templateType },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Onbekende e-mailfout";
    await insertEmailLog({
      templateType: input.templateType,
      recipient: input.to,
      subject,
      status: "failed",
      errorMessage: message,
      metadata: { template_type: input.templateType },
    });
    throw error;
  }
}
