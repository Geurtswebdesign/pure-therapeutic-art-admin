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

const RETRY_DELAYS_MS = [500, 1500] as const;

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Ontbrekende environment variable: ${name}`);
  }
  return value;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error ?? "Onbekende fout");
}

function normalizeGoogleMailError(error: unknown) {
  const message = getErrorMessage(error);

  if (message.includes("invalid_grant")) {
    return new Error(
      "Google OAuth refresh token is ongeldig of ingetrokken (invalid_grant). Maak een nieuwe GOOGLE_REFRESH_TOKEN aan en update de production env."
    );
  }

  return error;
}

function isRetryableGoogleMailError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();
  return (
    message.includes("premature close") ||
    message.includes("socket hang up") ||
    message.includes("econnreset") ||
    message.includes("etimedout") ||
    message.includes("network timeout") ||
    message.includes("invalid response body while trying to fetch")
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withGoogleMailRetry<T>(operation: () => Promise<T>) {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      const normalizedError = normalizeGoogleMailError(error);
      lastError = normalizedError;

      if (
        !isRetryableGoogleMailError(normalizedError) ||
        attempt >= RETRY_DELAYS_MS.length
      ) {
        throw normalizedError;
      }

      await delay(RETRY_DELAYS_MS[attempt]);
    }
  }

  throw normalizeGoogleMailError(lastError);
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

  const accessToken = await withGoogleMailRetry(() => oauth2Client.getAccessToken());
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
  await withGoogleMailRetry(() => transporter.verify());
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

  return withGoogleMailRetry(() =>
    transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      replyTo: replyTo || undefined,
      subject,
      html,
    })
  );
}
