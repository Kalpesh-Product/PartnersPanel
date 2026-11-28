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

// Visa's options were the only ones specified in the Figma mock; the other
// three below are sourced from each vertical's own client-facing request
// form on Nomads (the "Support Required" dropdown a client picks from), so
// partners declare support in the same terms clients actually ask for:
// - companySetupPartner: Nomads frontend/src/pages/AiNewCompanySetup.jsx
// - consultationSupportPartner: Nomads frontend/src/pages/AiConsultation.jsx
// - activationSupportPartner: Nomads frontend/src/pages/AiHelpGetActivated.jsx
// Workation has no such list anywhere — its own client form (AiWorkation.jsx)
// only collects headcount/destination/dates, no category picker — so it
// stays free-text until there's a real list to use.
export const VISA_TYPES_SUPPORTED = [
  "Explore / Travel",
  "Work Remotely",
  "Get a Job Abroad",
  "Study Abroad",
  "Start or Expand a Business",
  "Relocate / Settle Long-Term",
  "Move with Family",
];

export const COMPANY_SETUP_TYPES_SUPPORTED = [
  "Private / Co-Working Setup for Registration",
  "Virtual Office Setup for Registration",
  "Fresh Company Setup",
  "Subsidiary / Foreign Company Setup",
  "Branch / Liaison Office Setup",
  "LLP / Partnership Firm Registration",
  "Redomiciliation / Company Migration",
  "Setting up Holding Company Structure",
  "Sole Proprietorship Registration",
  "Offshore Company Setup",
  "Not Sure - Need Customised Support",
];

export const CONSULTATION_TYPES_SUPPORTED = [
  "Private Office / Co-Working Setup",
  "Private Home / Shared Stay Setup",
  "Business Expansion to New Country",
  "Company Compliance & Filings",
  "Accounting & Bookkeeping Services",
  "Tax Advisory & Structuring",
  "GST / VAT Registration & Filing",
  "Legal Documentation / Agreements",
  "Corporate Bank Account Opening",
  "Business Structuring Consultation",
  "Not Sure - Need Customised Support",
];

export const ACTIVATION_SUPPORT_TYPES_SUPPORTED = [
  "Virtual Office",
  "Co-Working",
  "Co-Living",
  "Hostels",
  "Workation",
  "Meeting Rooms",
  "Cafes",
  "Car & Bike renting",
  "Yacht Renting",
  "Airport Pickup / Drop",
  "Company Registration Support",
  "Personalised",
];

export const SERVICE_OFFERED_OPTIONS: Partial<Record<PartnerService, string[]>> = {
  visaPartner: VISA_TYPES_SUPPORTED,
  companySetupPartner: COMPANY_SETUP_TYPES_SUPPORTED,
  consultationSupportPartner: CONSULTATION_TYPES_SUPPORTED,
  activationSupportPartner: ACTIVATION_SUPPORT_TYPES_SUPPORTED,
};
