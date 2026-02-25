type RenderEmailLayoutInput = {
  appName: string;
  contentHtml: string;
  primaryColor?: string;
  logoUrl?: string;
  websiteUrl?: string;
  supportEmail?: string;
  footerText?: string;
  preheader?: string;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderEmailLayout({
  appName,
  contentHtml,
  primaryColor = "#3f3f46",
  logoUrl,
  websiteUrl,
  supportEmail,
  footerText,
  preheader,
}: RenderEmailLayoutInput): string {
  const safeAppName = escapeHtml(appName);
  const safePreheader = escapeHtml(preheader || "");
  const safeFooterText = escapeHtml(footerText || "");
  const safeSupportEmail = supportEmail ? escapeHtml(supportEmail) : "";
  const safeWebsiteUrl = websiteUrl ? escapeHtml(websiteUrl) : "";
  const safeLogoUrl = logoUrl ? escapeHtml(logoUrl) : "";

  const headerTitle = safeWebsiteUrl
    ? `<a href="${safeWebsiteUrl}" style="color:#3f3f46;text-decoration:none;">${safeAppName}</a>`
    : safeAppName;
  const supportLine = safeSupportEmail
    ? `<p style="margin:14px 0 0;font-size:13px;font-family:Corbel,Arial,Helvetica,sans-serif;color:#6b7280;">Vragen? Mail ons via <a href="mailto:${safeSupportEmail}" style="color:${primaryColor};text-decoration:none;">${safeSupportEmail}</a></p>`
    : "";
  const footerLine = safeFooterText
    ? `<p style="margin:10px 0 0;font-size:12px;font-family:Corbel,Arial,Helvetica,sans-serif;color:#9ca3af;">${safeFooterText}</p>`
    : "";
  const logoBlock = safeLogoUrl
    ? `<img src="${safeLogoUrl}" width="74" alt="${safeAppName}" style="display:block;border:0;outline:none;text-decoration:none;max-width:74px;width:74px;height:auto;object-fit:contain;">`
    : "";

  return `<!doctype html>
<html lang="nl">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <style>
      @media only screen and (max-width: 600px) {
        .brand-row .brand-logo,
        .brand-row .brand-title-cell {
          display: block !important;
          width: 100% !important;
          text-align: center !important;
        }
        .brand-row .brand-logo {
          padding: 0 0 8px !important;
        }
        .brand-row .brand-logo img {
          margin: 0 auto !important;
        }
        .brand-row .brand-title-cell {
          padding: 0 !important;
        }
      }
    </style>
    <title>${safeAppName}</title>
  </head>
  <body style="margin:0;padding:0;background:#FBF3E7;background-image:linear-gradient(180deg,#FBF3E7 0%,#FBF3E7 43%,#E4C9C3 100%);font-family:Corbel,Arial,Helvetica,sans-serif;color:#3f3f46;background-repeat:no-repeat;background-size:100% 100%;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${safePreheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="min-height:100vh;background:#FBF3E7;background-image:linear-gradient(180deg,#FBF3E7 0%,#FBF3E7 43%,#E4C9C3 100%);background-repeat:no-repeat;background-size:100% 100%;padding:14px 6px 22px;">
      <tr>
        <td align="center" valign="top" bgcolor="#FBF3E7" style="min-height:100vh;background:#FBF3E7;background-image:linear-gradient(180deg,#FBF3E7 0%,#FBF3E7 43%,#E4C9C3 100%);background-repeat:no-repeat;background-size:100% 100%;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:640px;">
            <tr>
              <td style="padding:8px 0 14px;text-align:center;">
                <table role="presentation" class="brand-row" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
                  <tr>
                    <td class="brand-logo" valign="middle" style="padding:0 12px 0 0;text-align:left;">
                      ${logoBlock}
                    </td>
                    <td class="brand-title-cell" valign="middle" style="text-align:left;">
                      <div style="font-family:Joan,Georgia,'Times New Roman',serif;font-size:clamp(34px,6vw,44px);line-height:1.12;font-weight:600;color:#3f3f46;letter-spacing:0.2px;word-break:break-word;">
                        ${headerTitle}
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="background:#ffffff;border:1px solid #e7e0d8;border-radius:20px;padding:22px 18px 20px;box-shadow:0 6px 24px rgba(30,41,59,0.06);">
                <div style="font-family:Corbel,Arial,Helvetica,sans-serif;font-size:16px;line-height:1.65;color:#374151;">
                  ${contentHtml}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 8px 0;text-align:center;">
                ${supportLine}
                ${footerLine}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
