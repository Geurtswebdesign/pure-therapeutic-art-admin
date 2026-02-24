export type EmailSettings = {
  fromName: string;
  fromEmail: string;
  replyTo: string;
  gmailUser: string;
  googleClientId: string;
  googleClientSecret: string;
  googleRefreshToken: string;
  hasClientSecret: boolean;
  hasRefreshToken: boolean;
};

export const DEFAULT_EMAIL_SETTINGS: EmailSettings = {
  fromName: "Pure Therapeutic ART",
  fromEmail: "",
  replyTo: "",
  gmailUser: "",
  googleClientId: "",
  googleClientSecret: "",
  googleRefreshToken: "",
  hasClientSecret: false,
  hasRefreshToken: false,
};
