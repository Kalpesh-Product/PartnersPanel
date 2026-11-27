// Mirrors the server's constants/partnerServices.ts (same keys, no shared
// package between client/server in this repo, so kept in sync manually).
export const PARTNER_SERVICES = [
  "visaPartner",
  "companySetupPartner",
  "activationSupportPartner",
  "consultationSupportPartner",
  "workationPartner",
] as const;

export type PartnerService = (typeof PARTNER_SERVICES)[number];

export const SERVICE_LABELS: Record<PartnerService, string> = {
  visaPartner: "Visa Support Partner",
  companySetupPartner: "Company Setup Services Partner",
  activationSupportPartner: "Activation Support Partner",
  consultationSupportPartner: "Consultation Support Partner",
  workationPartner: "Workation Support Partner",
};

export const SERVICE_DESCRIPTIONS: Record<PartnerService, string> = {
  visaPartner: "Tell us about your visa support partner business and the markets you serve.",
  companySetupPartner: "Tell us about your company setup services business and the markets you serve.",
  activationSupportPartner: "Tell us about your activation support services and the markets you serve.",
  consultationSupportPartner: "Tell us about your consultation support services and the markets you serve.",
  workationPartner: "Tell us about your workation support services and the destinations you serve.",
};

// The only vertical whose "Services Offered" options are actually specified
// in the Figma mock. The other 4 verticals never had a fixed option list
// designed, so their field is free-text (Autocomplete freeSolo) instead.
export const VISA_TYPES_SUPPORTED = [
  "Explore / Travel",
  "Work Remotely",
  "Get a Job Abroad",
  "Study Abroad",
  "Start or Expand a Business",
  "Relocate / Settle Long-Term",
  "Move with Family",
];
