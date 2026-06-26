import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeSupabaseStorageUrl } from "@/lib/images/supabaseStorageUrl";
import { normalizeTemplateHtml } from "@/lib/mail/normalizeTemplateHtml";
import { renderEmailLayout } from "@/lib/mail/renderEmailLayout";
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

const FALLBACK_EMAIL_TEMPLATES: Partial<
  Record<EmailTemplateType, EmailTemplateRow>
> = {
  reminder: {
    type: "reminder",
    sender_key: "noreply",
    subject: "{{subject}}",
    html: `
      <p>Hallo {{user_name}},</p>
      <p>{{reminder_text}}</p>
      <p>
        <a href="{{action_url}}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#1d2327;color:#ffffff;text-decoration:none;">
          {{action_label}}
        </a>
      </p>
      <p>Werkt de knop niet? Kopieer dan deze link naar je browser:</p>
      <p><a href="{{action_url}}">{{action_url}}</a></p>
    `,
    is_active: true,
  },
  welcome: {
    type: "welcome",
    sender_key: "noreply",
    subject: "Welkom bij {{app_name}}",
    html: `
      <p>Welkom {{user_name}},</p>
      <p>Je account is aangemaakt. Je kunt direct inloggen en aan de slag.</p>
      <p>
        <a href="{{action_url}}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#1d2327;color:#ffffff;text-decoration:none;">
          Naar je account
        </a>
      </p>
      <p>Werkt de knop niet? Kopieer dan deze link naar je browser:</p>
      <p><a href="{{action_url}}">{{action_url}}</a></p>
    `,
    is_active: true,
  },
  password_reset: {
    type: "password_reset",
    sender_key: "noreply",
    subject: "Wachtwoord herstellen",
    html: `
      <p>Je hebt een nieuw wachtwoord aangevraagd.</p>
      <p>Klik op de knop hieronder om een nieuw wachtwoord te kiezen.</p>
      <p>
        <a href="{{reset_url}}" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#1d2327;color:#ffffff;text-decoration:none;">
          Nieuw wachtwoord kiezen
        </a>
      </p>
      <p>Werkt de knop niet? Kopieer dan deze link naar je browser:</p>
      <p><a href="{{reset_url}}">{{reset_url}}</a></p>
      <p>Heb je dit niet aangevraagd? Dan kun je deze mail negeren.</p>
    `,
    is_active: true,
  },
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
  if (!data) {
    return DEFAULT_BRANDING;
  }

  return {
    ...data,
    logo_url: normalizeSupabaseStorageUrl(data.logo_url),
  };
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
  const payload = {
    template_type: input.templateType ?? null,
    recipient: input.recipient,
    subject: input.subject,
    status: input.status,
    provider: "google_oauth2",
    error_message: input.errorMessage ?? null,
    metadata: {
      ...(input.metadata ?? {}),
      requested_template_type: input.templateType ?? null,
    },
    sent_at: input.status === "sent" ? new Date().toISOString() : null,
  };

  const { error } = await supabase.from("email_logs").insert(payload);

  if (error) {
    if (input.templateType) {
      const { error: fallbackError } = await supabase.from("email_logs").insert({
        ...payload,
        template_type: null,
      });

      if (!fallbackError) return;
      console.warn("Email log fallback insert failed:", fallbackError.message);
    }

    console.warn("Email log insert failed:", error.message);
  }
}

export async function sendTransactionalEmail(input: {
  templateType: EmailTemplateType;
  to: string;
  variables?: Record<string, unknown>;
  logMetadata?: Record<string, unknown>;
}) {
  const storedTemplate = await getEmailTemplate(input.templateType);
  const fallbackTemplate = FALLBACK_EMAIL_TEMPLATES[input.templateType] ?? null;
  const template =
    storedTemplate ??
    fallbackTemplate;
  const usesFallbackTemplate = !storedTemplate && Boolean(fallbackTemplate);
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
  const contentHtml = normalizeTemplateHtml(renderTemplate(template.html, merged));
  const html = renderEmailLayout({
    appName: merged.app_name,
    contentHtml,
    primaryColor: merged.primary_color,
    logoUrl: merged.logo_url,
    websiteUrl: merged.website_url,
    supportEmail: merged.support_email,
    footerText: merged.footer_text,
    preheader: subject,
  });
  const sender = await getEmailSenderProfile(template.sender_key);
  const fallbackSenderEmail = process.env.GOOGLE_SENDER_EMAIL?.trim();

  if (sender && !sender.is_active && !usesFallbackTemplate) {
    throw new Error(`Afzenderprofiel '${template.sender_key}' is niet actief.`);
  }
  if (!sender && (!usesFallbackTemplate || !fallbackSenderEmail)) {
    throw new Error(`Afzenderprofiel '${template.sender_key}' bestaat niet.`);
  }
  if (!sender?.email?.trim() && (!usesFallbackTemplate || !fallbackSenderEmail)) {
    throw new Error(
      `Afzenderprofiel '${template.sender_key}' heeft geen e-mailadres. Vul dit in bij Settings > Email > Afzenders.`
    );
  }
  const senderName = usesFallbackTemplate
    ? branding.app_name
    : sender?.name || branding.app_name;
  const senderEmail = usesFallbackTemplate
    ? fallbackSenderEmail
    : sender?.email?.trim();
  if (!senderEmail) {
    throw new Error("Ontbrekende environment variable: GOOGLE_SENDER_EMAIL");
  }
  const replyTo = sender?.reply_to || branding.support_email || undefined;

  await insertEmailLog({
    templateType: input.templateType,
    recipient: input.to,
    subject,
    status: "queued",
    metadata: {
      ...(input.logMetadata ?? {}),
      template_type: input.templateType,
      sender_key: template.sender_key,
      sender_email: senderEmail,
    },
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
      metadata: {
        ...(input.logMetadata ?? {}),
        template_type: input.templateType,
        sender_key: template.sender_key,
        sender_email: senderEmail,
      },
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
      metadata: {
        ...(input.logMetadata ?? {}),
        template_type: input.templateType,
        sender_key: template.sender_key,
        sender_email: senderEmail,
      },
    });
    throw error;
  }
}
