"use client";

import { useMemo, useState, useTransition } from "react";
import {
  saveEmailBranding,
  saveEmailSenderProfiles,
  saveEmailTemplate,
  sendEmailSettingsTest,
} from "@/lib/settings/email-actions";
import {
  EMAIL_TEMPLATE_TYPES,
  EMAIL_SENDER_KEYS,
  type EmailSenderKey,
  type EmailTemplateType,
} from "@/lib/mail/types";
import type { UiLanguage } from "@/lib/i18n/runtime";

type TemplateRow = {
  id: string;
  type: EmailTemplateType;
  sender_key: EmailSenderKey;
  subject: string;
  html: string;
  is_active: boolean;
  updated_at: string;
};

type Branding = {
  id: string;
  app_name: string;
  primary_color: string;
  logo_url: string | null;
  support_email: string | null;
  footer_text: string | null;
  website_url: string | null;
};

type EmailLog = {
  id: string;
  template_type: string | null;
  recipient: string;
  subject: string;
  status: string;
  error_message: string | null;
  created_at: string;
};

type Props = {
  language: UiLanguage;
  smtpStatus: {
    hasClientId: boolean;
    hasClientSecret: boolean;
    hasRefreshToken: boolean;
    hasSenderEmail: boolean;
    hasAllowedSenderEmails: boolean;
  };
  templates: TemplateRow[];
  senderProfiles: Array<{
    id: string;
    key: EmailSenderKey;
    name: string;
    email: string | null;
    reply_to: string | null;
    is_active: boolean;
  }>;
  branding: Branding;
  logs: EmailLog[];
};

type Tab = "smtp" | "templates" | "senders" | "branding" | "test";

export default function EmailSettingsForm({
  smtpStatus,
  templates,
  senderProfiles,
  branding,
  logs,
}: Props) {
  const [tab, setTab] = useState<Tab>("smtp");
  const templateOptions = templates.length
    ? templates.map((t) => t.type)
    : [...EMAIL_TEMPLATE_TYPES];
  const [templateType, setTemplateType] = useState<EmailTemplateType>(
    templates[0]?.type ?? templateOptions[0]
  );
  const selectedTemplate = useMemo(
    () => templates.find((t) => t.type === templateType),
    [templates, templateType]
  );

  const [subject, setSubject] = useState(selectedTemplate?.subject ?? "");
  const [html, setHtml] = useState(selectedTemplate?.html ?? "");
  const [isActive, setIsActive] = useState(selectedTemplate?.is_active ?? true);
  const [senderKey, setSenderKey] = useState<EmailSenderKey>(
    selectedTemplate?.sender_key ?? "noreply"
  );
  const [sendersDraft, setSendersDraft] = useState(() =>
    (senderProfiles.length
      ? senderProfiles
      : EMAIL_SENDER_KEYS.map((key) => ({
          id: key,
          key,
          name: key,
          email: null,
          reply_to: null,
          is_active: true,
        })))
      .map((row) => ({
        key: row.key,
        name: row.name,
        email: row.email ?? "",
        reply_to: row.reply_to ?? "",
        is_active: row.is_active,
      }))
  );

  const [appName, setAppName] = useState(branding.app_name);
  const [primaryColor, setPrimaryColor] = useState(branding.primary_color);
  const [logoUrl, setLogoUrl] = useState(branding.logo_url ?? "");
  const [supportEmail, setSupportEmail] = useState(branding.support_email ?? "");
  const [footerText, setFooterText] = useState(branding.footer_text ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(branding.website_url ?? "");

  const [testRecipient, setTestRecipient] = useState("");
  const [testTemplate, setTestTemplate] = useState<EmailTemplateType>(
    templates[0]?.type ?? templateOptions[0]
  );

  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function loadTemplate(type: EmailTemplateType) {
    const next = templates.find((t) => t.type === type);
    setTemplateType(type);
    setSubject(next?.subject ?? "");
    setHtml(next?.html ?? "");
    setIsActive(next?.is_active ?? true);
    setSenderKey(next?.sender_key ?? "noreply");
  }

  function runAction(action: () => Promise<void>, successMessage: string) {
    setNotice(null);
    setError(null);
    startTransition(async () => {
      try {
        await action();
        setNotice(successMessage);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Actie mislukt.");
      }
    });
  }

  return (
    <div className="space-y-4 rounded border bg-white p-5">
      <div className="flex flex-wrap gap-2 border-b pb-3">
        <button type="button" onClick={() => setTab("smtp")} className={`rounded px-3 py-1.5 text-sm ${tab === "smtp" ? "bg-black text-white" : "hover:bg-gray-100"}`}>SMTP Config</button>
        <button type="button" onClick={() => setTab("templates")} className={`rounded px-3 py-1.5 text-sm ${tab === "templates" ? "bg-black text-white" : "hover:bg-gray-100"}`}>Templates</button>
        <button type="button" onClick={() => setTab("senders")} className={`rounded px-3 py-1.5 text-sm ${tab === "senders" ? "bg-black text-white" : "hover:bg-gray-100"}`}>Afzenders</button>
        <button type="button" onClick={() => setTab("branding")} className={`rounded px-3 py-1.5 text-sm ${tab === "branding" ? "bg-black text-white" : "hover:bg-gray-100"}`}>Branding</button>
        <button type="button" onClick={() => setTab("test")} className={`rounded px-3 py-1.5 text-sm ${tab === "test" ? "bg-black text-white" : "hover:bg-gray-100"}`}>Test Email</button>
      </div>

      {tab === "smtp" ? (
        <div className="space-y-2 text-sm">
          <p className="text-gray-700">OAuth2 status vanuit environment variables:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>GOOGLE_CLIENT_ID: {smtpStatus.hasClientId ? "OK" : "ONTBREEKT"}</li>
            <li>GOOGLE_CLIENT_SECRET: {smtpStatus.hasClientSecret ? "OK" : "ONTBREEKT"}</li>
            <li>GOOGLE_REFRESH_TOKEN: {smtpStatus.hasRefreshToken ? "OK" : "ONTBREEKT"}</li>
            <li>GOOGLE_SENDER_EMAIL: {smtpStatus.hasSenderEmail ? "OK" : "ONTBREEKT"}</li>
            <li>GOOGLE_ALLOWED_SENDER_EMAILS: {smtpStatus.hasAllowedSenderEmails ? "OK" : "OPTIONEEL"}</li>
          </ul>
          <p className="text-xs text-gray-500">
            Tip: zet meerdere afzenders komma-gescheiden in GOOGLE_ALLOWED_SENDER_EMAILS.
          </p>
        </div>
      ) : null}

      {tab === "templates" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runAction(
              () =>
                saveEmailTemplate({
                  type: templateType,
                  senderKey,
                  subject,
                  html,
                  isActive,
                }),
              "Template opgeslagen."
            );
          }}
          className="space-y-3"
        >
          <label className="block space-y-1">
            <span className="text-sm">Template type</span>
            <select
              value={templateType}
              onChange={(e) => loadTemplate(e.target.value as EmailTemplateType)}
              className="w-full rounded border px-3 py-2 text-sm"
            >
              {templateOptions.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-sm">Subject</span>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded border px-3 py-2 text-sm" />
          </label>
          <label className="block space-y-1">
            <span className="text-sm">Afzenderprofiel</span>
            <select
              value={senderKey}
              onChange={(e) => setSenderKey(e.target.value as EmailSenderKey)}
              className="w-full rounded border px-3 py-2 text-sm"
            >
              {sendersDraft.map((sender) => (
                <option key={sender.key} value={sender.key}>
                  {sender.key} - {sender.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-sm">HTML</span>
            <textarea value={html} onChange={(e) => setHtml(e.target.value)} rows={10} className="w-full rounded border px-3 py-2 font-mono text-xs" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Actief
          </label>
          <button type="submit" disabled={isPending} className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-60">
            {isPending ? "Opslaan..." : "Template opslaan"}
          </button>
        </form>
      ) : null}

      {tab === "senders" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runAction(
              () =>
                saveEmailSenderProfiles(
                  sendersDraft.map((row) => ({
                    key: row.key as EmailSenderKey,
                    name: row.name,
                    email: row.email,
                    replyTo: row.reply_to,
                    isActive: row.is_active,
                  }))
                ),
              "Afzenders opgeslagen."
            );
          }}
          className="space-y-3"
        >
          <div className="overflow-auto rounded border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left">Key</th>
                  <th className="px-2 py-2 text-left">Naam</th>
                  <th className="px-2 py-2 text-left">E-mail</th>
                  <th className="px-2 py-2 text-left">Reply-to</th>
                  <th className="px-2 py-2 text-left">Actief</th>
                </tr>
              </thead>
              <tbody>
                {sendersDraft.map((sender, idx) => (
                  <tr key={sender.key} className="border-t">
                    <td className="px-2 py-2 font-mono text-xs">{sender.key}</td>
                    <td className="px-2 py-2">
                      <input
                        value={sender.name}
                        onChange={(e) =>
                          setSendersDraft((prev) =>
                            prev.map((row, rowIdx) =>
                              rowIdx === idx ? { ...row, name: e.target.value } : row
                            )
                          )
                        }
                        className="w-full rounded border px-2 py-1"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        value={sender.email}
                        onChange={(e) =>
                          setSendersDraft((prev) =>
                            prev.map((row, rowIdx) =>
                              rowIdx === idx ? { ...row, email: e.target.value } : row
                            )
                          )
                        }
                        className="w-full rounded border px-2 py-1"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        value={sender.reply_to}
                        onChange={(e) =>
                          setSendersDraft((prev) =>
                            prev.map((row, rowIdx) =>
                              rowIdx === idx ? { ...row, reply_to: e.target.value } : row
                            )
                          )
                        }
                        className="w-full rounded border px-2 py-1"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="checkbox"
                        checked={sender.is_active}
                        onChange={(e) =>
                          setSendersDraft((prev) =>
                            prev.map((row, rowIdx) =>
                              rowIdx === idx ? { ...row, is_active: e.target.checked } : row
                            )
                          )
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="submit" disabled={isPending} className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-60">
            {isPending ? "Opslaan..." : "Afzenders opslaan"}
          </button>
        </form>
      ) : null}

      {tab === "branding" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runAction(
              () =>
                saveEmailBranding({
                  appName,
                  primaryColor,
                  logoUrl,
                  supportEmail,
                  footerText,
                  websiteUrl,
                }),
              "Branding opgeslagen."
            );
          }}
          className="grid gap-3"
        >
          <input value={appName} onChange={(e) => setAppName(e.target.value)} placeholder="App naam" className="w-full rounded border px-3 py-2 text-sm" />
          <input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} placeholder="#111827" className="w-full rounded border px-3 py-2 text-sm" />
          <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="Logo URL" className="w-full rounded border px-3 py-2 text-sm" />
          <input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} placeholder="Support email" className="w-full rounded border px-3 py-2 text-sm" />
          <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="Website URL" className="w-full rounded border px-3 py-2 text-sm" />
          <textarea value={footerText} onChange={(e) => setFooterText(e.target.value)} rows={3} placeholder="Footer tekst" className="w-full rounded border px-3 py-2 text-sm" />
          <button type="submit" disabled={isPending} className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-60">
            {isPending ? "Opslaan..." : "Branding opslaan"}
          </button>
        </form>
      ) : null}

      {tab === "test" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runAction(
              () => sendEmailSettingsTest({ to: testRecipient, templateType: testTemplate }),
              "Testmail verzonden."
            );
          }}
          className="space-y-3"
        >
          <label className="block space-y-1">
            <span className="text-sm">Ontvanger</span>
            <input
              type="email"
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
              className="w-full rounded border px-3 py-2 text-sm"
              required
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm">Template</span>
            <select
              value={testTemplate}
              onChange={(e) => setTestTemplate(e.target.value as EmailTemplateType)}
              className="w-full rounded border px-3 py-2 text-sm"
            >
              {templateOptions.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={isPending} className="rounded border px-4 py-2 text-sm hover:bg-gray-100 disabled:opacity-60">
            {isPending ? "Versturen..." : "Testmail versturen"}
          </button>

          <div className="space-y-1 border-t pt-3">
            <h3 className="text-sm font-semibold">Recente email logs</h3>
            <div className="max-h-56 overflow-auto rounded border">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1 text-left">Datum</th>
                    <th className="px-2 py-1 text-left">Type</th>
                    <th className="px-2 py-1 text-left">Ontvanger</th>
                    <th className="px-2 py-1 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-t">
                      <td className="px-2 py-1">{new Date(log.created_at).toLocaleString("nl-NL")}</td>
                      <td className="px-2 py-1">{log.template_type ?? "n/a"}</td>
                      <td className="px-2 py-1">{log.recipient}</td>
                      <td className="px-2 py-1">{log.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </form>
      ) : null}

      {notice ? <p className="text-sm text-green-700">{notice}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
