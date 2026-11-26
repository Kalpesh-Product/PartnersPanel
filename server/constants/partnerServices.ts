// Keys mirror the NomadUser role flags added on the Nomads side (isVisaPartner,
// isCompanySetupPartner, isActivationSupportPartner, isConsultationSupportPartner,
// isWorkationPartner), just without the "is" prefix, so leads/invites/accounts
// agree on the same vertical identifiers across repos.
export const PARTNER_SERVICES = [
  "visaPartner",
  "companySetupPartner",
  "activationSupportPartner",
  "consultationSupportPartner",
  "workationPartner",
] as const;

export type PartnerService = (typeof PARTNER_SERVICES)[number];

export const PARTNER_SERVICE_LABELS: Record<PartnerService, string> = {
  visaPartner: "Visa & Immigration Partner",
  companySetupPartner: "Company Setup Services Partner",
  activationSupportPartner: "Activation Support Partner",
  consultationSupportPartner: "Consultation Support Partner",
  workationPartner: "Workation Support Partner",
};

export const isPartnerService = (value: unknown): value is PartnerService =>
  typeof value === "string" && (PARTNER_SERVICES as readonly string[]).includes(value);
