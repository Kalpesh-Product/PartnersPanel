import { PARTNER_SERVICE_LABELS, type PartnerService } from "../constants/partnerServices.js";

const escapeHtml = (value: string) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const shell = (title: string, bodyHtml: string) => `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #0F172A;">
    <h2 style="margin: 0 0 16px;">${escapeHtml(title)}</h2>
    ${bodyHtml}
    <p style="margin-top: 24px; font-size: 12px; color: #64748B;">WONO Partners</p>
  </div>
`;

export const buildPartnerInviteEmail = (params: {
  fullName: string;
  services: PartnerService[];
  registerUrl: string;
}) => {
  const serviceLabels = params.services.map((service) => PARTNER_SERVICE_LABELS[service]).join(", ");
  return {
    subject: "You're invited to become a WONO Partner",
    html: shell(
      "You're Invited!",
      `
        <p>Hello ${escapeHtml(params.fullName || "there")},</p>
        <p>WONO has approved your application for: <b>${escapeHtml(serviceLabels)}</b>.</p>
        <p>Click below to complete your registration and set up your Partners account.</p>
        <p style="margin: 24px 0;">
          <a href="${params.registerUrl}" style="background:#2563EB;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">Complete Registration</a>
        </p>
        <p style="font-size: 12px; color: #64748B;">This invite link expires in 7 days.</p>
      `,
    ),
    text: `Hello ${params.fullName || "there"},\n\nWONO has approved your application for: ${serviceLabels}.\n\nComplete your registration: ${params.registerUrl}`,
  };
};

export const buildOtpEmail = (params: { fullName: string; code: string; expiryMinutes: number }) => ({
  subject: "Verify Your WONO Partners Account",
  html: shell(
    "Verify Your Account",
    `
      <p>Hello ${escapeHtml(params.fullName || "there")},</p>
      <p>Use the verification code below to continue your registration.</p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 24px 0;">${escapeHtml(params.code)}</p>
      <p style="font-size: 12px; color: #64748B;">This code expires in ${params.expiryMinutes} minutes. Never share it with anyone.</p>
    `,
  ),
  text: `Hello ${params.fullName || "there"},\n\nYour verification code is: ${params.code}\n\nThis code expires in ${params.expiryMinutes} minutes.`,
});
