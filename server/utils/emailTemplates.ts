import { PARTNER_SERVICE_LABELS, type PartnerService } from "../constants/partnerServices.js";

const escapeHtml = (value: string) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const logoUrl = "https://www.wono.co/email-logo-wono.svg";

const shell = (title: string, subtitle: string, bodyHtml: string) => `
  <!doctype html>
  <html lang="en">
    <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
    <body style="margin:0;padding:32px 16px;background:#eef4fb;font-family:Poppins,Arial,sans-serif;color:#344054;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;margin:0 auto;border:1px solid #dce7f5;border-radius:14px;overflow:hidden;background:#fff;">
        <tr><td style="height:5px;background:linear-gradient(90deg,#0BA9EF,#1e40af);font-size:0;line-height:5px;">&nbsp;</td></tr>
        <tr><td style="padding:26px 32px;text-align:center;border-bottom:1px solid #eef2f8;">
          <img src="${logoUrl}" alt="WONO" width="140" height="40" style="display:block;margin:0 auto;border:0;height:40px;width:140px;" />
          <p style="margin:8px 0 0;font-size:12px;font-weight:500;color:#1f2733;">World of Nomads</p>
        </td></tr>
        <tr><td style="padding:40px 32px 28px;text-align:center;background:#f3f9fe;">
          <div style="width:60px;height:60px;line-height:60px;border-radius:50%;background:#0BA9EF;margin:0 auto 18px;color:#fff;font-size:28px;">&#10003;</div>
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#123a75;">${escapeHtml(title)}</h1>
          <p style="margin:0;font-size:14px;color:#55617a;">${escapeHtml(subtitle)}</p>
        </td></tr>
        ${bodyHtml}
        <tr><td style="padding:28px 32px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dceafb;border-radius:10px;background:#f3f9fe;">
            <tr><td style="padding:18px 24px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;color:#55617a;">Need Immediate Assistance?</p>
              <p style="margin:0 0 14px;font-size:14px;"><a href="mailto:response@wono.co" style="color:#0BA9EF;text-decoration:none;font-weight:600;">response@wono.co</a> &nbsp;|&nbsp; <a href="https://www.wono.co" style="color:#0BA9EF;text-decoration:none;font-weight:600;">www.wono.co</a></p>
              <p style="margin:0;font-size:13px;color:#55617a;">Welcome aboard,<br/>Team WONO</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:22px 32px;text-align:center;background:#1d5fa8;">
          <p style="margin:0 0 6px;font-size:11px;color:#cfe3fb;">&copy; Copyright 2026-27 All Rights Reserved.<br/>WONOCO PRIVATE LIMITED - SINGAPORE.</p>
          <p style="margin:0;font-size:11px;"><a href="https://www.wono.co/privacy" style="color:#eaf4ff;text-decoration:underline;">Privacy Policy</a> &nbsp;|&nbsp; <a href="https://www.wono.co/terms-and-conditions" style="color:#eaf4ff;text-decoration:underline;">Terms &amp; Conditions</a></p>
        </td></tr>
      </table>
    </body>
  </html>
`;

const detailRow = (label: string, value: unknown, first = false) => `
  <tr>
    <td style="padding:9px 0;width:38%;color:#8a93a3;${first ? "" : "border-top:1px solid #eef2f8;"}">${escapeHtml(label)}</td>
    <td style="padding:9px 0;text-align:right;font-weight:500;color:#16233b;${first ? "" : "border-top:1px solid #eef2f8;"}">${escapeHtml(String(value || "-"))}</td>
  </tr>`;

export const buildPartnerInviteEmail = (params: {
  fullName: string;
  services: PartnerService[];
  registerUrl: string;
  email?: string;
  contactCode?: string;
  contactNumber?: string;
  linkedinProfile?: string;
  currentCountry?: string;
  message?: string;
  submittedAt?: Date | null;
}) => {
  const serviceLabels = params.services.map((service) => PARTNER_SERVICE_LABELS[service]).join(", ");
  const contact = [params.contactCode, params.contactNumber].filter(Boolean).join(" ") || "-";
  const submittedOn = params.submittedAt
    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(new Date(params.submittedAt))
    : "-";
  const details = [
    ["Full Name", params.fullName],
    ["Country", params.currentCountry],
    ["Contact", contact],
    ["Email", params.email],
    ["LinkedIn", params.linkedinProfile],
    ["Submitted On", submittedOn],
  ];
  return {
    subject: "You're invited to become a WONO Partner",
    html: shell(
      "You're Invited to Join WONO!",
      `Your application as a ${serviceLabels} has been approved.`,
      `
        <tr><td style="padding:28px 32px 0;font-size:14px;line-height:1.65;color:#344054;">
          <p style="margin:0 0 18px;">Hi <b>${escapeHtml(params.fullName || "there")}</b>,</p>
          <p style="margin:0;">Great news — your submission as a WONO <b>${escapeHtml(serviceLabels)}</b> has been approved. Click below to register and set up your login. This invitation link already confirms your approved email address.</p>
        </td></tr>
        <tr><td style="padding:28px 32px 4px;">
          <p style="margin:0 0 12px;font-size:12px;font-weight:600;letter-spacing:.5px;color:#0BA9EF;text-transform:uppercase;">Your Submission</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;color:#344054;">
            ${details.map((row, index) => detailRow(String(row[0]), row[1], index === 0)).join("")}
          </table>
        </td></tr>
        <tr><td style="padding:28px 32px 4px;text-align:center;">
          <a href="${params.registerUrl}" style="display:inline-block;background:#0BA9EF;color:#fff;padding:13px 32px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Complete Registration</a>
          <p style="margin:12px 0 0;font-size:12px;color:#55617a;">This invite link expires in 7 days.</p>
        </td></tr>
        <tr><td style="padding:28px 32px 4px;">
          <p style="margin:0 0 12px;font-size:12px;font-weight:600;letter-spacing:.5px;color:#0BA9EF;text-transform:uppercase;">What Happens Next?</p>
          <p style="margin:6px 0;font-size:14px;color:#344054;">&#10003;&nbsp; Click the button above to register and create your password.</p>
          <p style="margin:6px 0;font-size:14px;color:#344054;">&#10003;&nbsp; Log in with your new WONO Partner account.</p>
          <p style="margin:6px 0;font-size:14px;color:#344054;">&#10003;&nbsp; Start receiving and responding to partner leads on WONO.</p>
        </td></tr>
        ${params.message ? `<tr><td style="padding:28px 32px 4px;"><p style="margin:0 0 12px;font-size:12px;font-weight:600;letter-spacing:.5px;color:#0BA9EF;text-transform:uppercase;">Your Message</p><div style="padding:14px 18px;border:1px solid #dceafb;border-radius:10px;background:#f3f9fe;font-size:14px;color:#55617a;">&ldquo;${escapeHtml(params.message)}&rdquo;</div></td></tr>` : ""}
      `,
    ),
    text: `Hello ${params.fullName || "there"},\n\nWONO has approved your application for: ${serviceLabels}.\n\nComplete your registration: ${params.registerUrl}`,
  };
};

export const buildOtpEmail = (params: { fullName: string; code: string; expiryMinutes: number }) => ({
  subject: "Verify Your WONO Partners Account",
  html: shell(
    "Verify Your Account",
    "Use the verification code below to continue.",
    `
      <tr><td style="padding:30px 32px 0;font-size:14px;line-height:1.65;color:#344054;">
        <p style="margin:0 0 18px;">Hi <b>${escapeHtml(params.fullName || "there")}</b>,</p>
        <p style="margin:0;">Enter this one-time code on the verification screen to confirm your identity.</p>
      </td></tr>
      <tr><td style="padding:24px 32px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dceafb;border-radius:10px;background:#f3f9fe;">
          <tr><td style="padding:24px;text-align:center;">
            <p style="margin:0 0 10px;font-size:11px;font-weight:600;letter-spacing:1px;color:#55617a;text-transform:uppercase;">Your Verification Code</p>
            <p style="margin:0;font-size:34px;line-height:1.2;font-weight:700;letter-spacing:10px;color:#123a75;">${escapeHtml(params.code)}</p>
            <p style="margin:12px 0 0;font-size:12px;color:#64748b;">Expires in ${params.expiryMinutes} minutes</p>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:24px 32px 0;">
        <div style="padding:16px 18px;border:1px solid #dceafb;border-radius:10px;background:#f8fbff;font-size:12px;line-height:1.6;color:#64748b;">
          For your security, never share this verification code with anyone. WONO will never ask for your OTP, password, or account credentials.
        </div>
      </td></tr>
    `,
  ),
  text: `Hello ${params.fullName || "there"},\n\nYour verification code is: ${params.code}\n\nThis code expires in ${params.expiryMinutes} minutes.`,
});
