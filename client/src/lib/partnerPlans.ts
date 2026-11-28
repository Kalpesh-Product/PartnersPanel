// Mirrors the server's Partner.plan enum (free | starter | growth) so the
// dashboard can show the same plan strip HostPanel's dashboards show.
export type PartnerPlanKey = "free" | "starter" | "growth";

export const PARTNER_PLAN_LABELS: Record<PartnerPlanKey, string> = {
  free: "Free",
  starter: "Starter",
  growth: "Customise",
};

// Monthly lead allowance per plan — the number the dashboard's plan card
// counts against ("3 / 5 leads used").
export const PARTNER_LEAD_ALLOWANCE: Record<PartnerPlanKey, number> = {
  free: 5,
  starter: 10,
  growth: 25,
};

export interface UpgradePlanOption {
  key: Exclude<PartnerPlanKey, "free">;
  title: string;
  badge?: string;
  headline?: string;
  monthlyPrice: number | null;
  leadAllowance: number;
  tagline: string;
  features: string[];
  ctaLabel: string;
}

// Same two-card upgrade offer shown in the partner-panel mock: Starter (most
// popular) and the personalised Customise plan. HostPanel's upgrade modal is
// the reference for the layout; the numbers here are the partner tiers.
export const UPGRADE_PLAN_OPTIONS: UpgradePlanOption[] = [
  {
    key: "starter",
    title: "Starter",
    badge: "Most popular",
    monthlyPrice: 50,
    leadAllowance: 10,
    tagline: "For partners ready for more monthly volume.",
    features: ["10 new leads each month", "Up to 5 Partners", "Standard lead matching"],
    ctaLabel: "Upgrade to Starter",
  },
  {
    key: "growth",
    title: "Customise",
    headline: "Personalised",
    monthlyPrice: null,
    leadAllowance: 25,
    tagline: "For partners handling higher monthly volume.",
    features: ["25 new leads each month", "Unlimited Partners", "Standard lead matching"],
    ctaLabel: "Upgrade to Growth",
  },
];

export const ANNUAL_SAVE_PERCENT = 16;

/** Plans above the partner's current one — what the upgrade modal offers. */
export const upgradeOptionsFor = (currentPlan: PartnerPlanKey) => {
  const order: PartnerPlanKey[] = ["free", "starter", "growth"];
  const currentIndex = order.indexOf(currentPlan);
  return UPGRADE_PLAN_OPTIONS.filter((option) => order.indexOf(option.key) > currentIndex);
};
