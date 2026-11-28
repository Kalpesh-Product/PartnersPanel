import type { PartnerService } from "./partnerServices";

// Copy used by both the sidebar and the dashboard so nav labels and card
// titles stay in sync (mirrors HostPanel's per-module naming).
export const serviceDashboardCopy: Record<PartnerService, { short: string; lead: string; request: string; analytics: string }> = {
  visaPartner: { short: "Visa", lead: "Visa Support Leads", request: "Visa Applications", analytics: "Visa Analytics" },
  companySetupPartner: { short: "Company Setup", lead: "Company Setup Leads", request: "Company Setup Requests", analytics: "Company Setup Analytics" },
  activationSupportPartner: { short: "Activation", lead: "Activation Leads", request: "Activation Requests", analytics: "Activation Analytics" },
  consultationSupportPartner: { short: "Consultation", lead: "Consultation Leads", request: "Consultation Requests", analytics: "Consultation Analytics" },
  workationPartner: { short: "Workation", lead: "Workation Leads", request: "Workation Requests", analytics: "Workation Analytics" },
};
