import nodemailer from "nodemailer";
import { google } from "googleapis";

type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  fromName?: string;
  fromEmail: string;
  replyTo?: string;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Ontbrekende environment variable: ${name}`);
  }
  return value;
}

async function createGoogleMailTransporter() {
  const clientId = getRequiredEnv("GOOGLE_CLIENT_ID");
  const clientSecret = getRequiredEnv("GOOGLE_CLIENT_SECRET");
  const refreshToken = getRequiredEnv("GOOGLE_REFRESH_TOKEN");
  const senderEmail = getRequiredEnv("GOOGLE_SENDER_EMAIL");

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  const accessToken = await oauth2Client.getAccessToken();
  const token = accessToken.token;

  if (!token) {
    throw new Error("Kon geen Google access token ophalen.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: senderEmail,
      clientId,
      clientSecret,
      refreshToken,
      accessToken: token,
    },
  });
}

export async function verifyGoogleMailProvider() {
  const transporter = await createGoogleMailTransporter();
  await transporter.verify();
}

export async function sendMail({
  to,
  subject,
  html,
  fromName = "Pure Therapeutic ART Therapy",
  fromEmail,
  replyTo,
}: SendMailInput) {
  const senderEmail = getRequiredEnv("GOOGLE_SENDER_EMAIL");
  const allowedFromEmails = new Set(
    [
      senderEmail,
      ...(process.env.GOOGLE_ALLOWED_SENDER_EMAILS ?? "")
        .split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean),
    ].map((value) => value.toLowerCase())
  );

  if (!allowedFromEmails.has(fromEmail.toLowerCase())) {
    throw new Error(
      `Afzender '${fromEmail}' is niet toegestaan. Voeg dit adres toe aan GOOGLE_ALLOWED_SENDER_EMAILS en configureer Gmail 'Send mail as'.`
    );
  }

  const transporter = await createGoogleMailTransporter();

  return transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to,
    replyTo: replyTo || undefined,
    subject,
    html,
  });
}
