export const EMAIL_TEMPLATE_TYPES = [
  "unlock_content",
  "reminder",
  "credits_added",
  "welcome",
  "password_reset",
] as const;

export type EmailTemplateType = (typeof EMAIL_TEMPLATE_TYPES)[number];

export const EMAIL_SENDER_KEYS = [
  "techsupport",
  "noreply",
  "meldingen",
  "klantenservice",
  "facturatie",
] as const;

export type EmailSenderKey = (typeof EMAIL_SENDER_KEYS)[number];

export type EmailBrandingSettings = {
  app_name: string;
  primary_color: string;
  logo_url: string | null;
  support_email: string | null;
  footer_text: string | null;
  website_url: string | null;
};

export type EmailSenderProfile = {
  id: string;
  key: EmailSenderKey;
  name: string;
  email: string | null;
  reply_to: string | null;
  is_active: boolean;
};
