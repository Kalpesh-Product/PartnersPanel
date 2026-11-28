import { useState } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import {
  ANNUAL_SAVE_PERCENT,
  upgradeOptionsFor,
  type PartnerPlanKey,
  type UpgradePlanOption,
} from "../../lib/partnerPlans";

// Port of HostPanel's UpgradePlanModal (pages/Dashboard/FrontendDashboard/
// ModuleCardsLanding.tsx) — same backdrop, header, Monthly/Annual segmented
// toggle and card grid — with the partner panel's Starter / Customise tiers.
interface UpgradePlanModalProps {
  currentPlan: PartnerPlanKey;
  requestedPlan?: string | null;
  submittingPlan?: string | null;
  onClose: () => void;
  onRequest: (plan: UpgradePlanOption["key"], billingCycle: "monthly" | "annual") => void;
}

const UpgradePlanModal = ({ currentPlan, requestedPlan, submittingPlan, onClose, onRequest }: UpgradePlanModalProps) => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const options = upgradeOptionsFor(currentPlan);
  if (options.length === 0) return null;

  const priceLabel = (option: UpgradePlanOption) => {
    if (option.monthlyPrice == null) return "Personalised";
    const price = billingCycle === "annual" ? Math.round(option.monthlyPrice * (1 - ANNUAL_SAVE_PERCENT / 100)) : option.monthlyPrice;
    return `$${price} / month`;
  };

  return createPortal(
    <div className="fixed inset-0 z-[1400] flex items-center justify-center bg-[#0f172a]/45 px-4 py-6 backdrop-blur-[2px]">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-[#dbe5f2] bg-[linear-gradient(180deg,#ffffff_0%,#f7faff_100%)] p-5 shadow-[0_20px_80px_rgba(15,23,42,0.28)] sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[22px] font-pmedium uppercase tracking-normal text-[#111b33] sm:text-[26px]">Upgrade Plan</h2>
            <p className="mt-1.5 text-[13px] font-pregular text-[#63738d]">
              Choose the plan you want and send the upgrade request to master panel.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close upgrade plans"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d7dfeb] text-[#5c6d84] transition hover:bg-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mb-5 mt-5 flex justify-center">
          <div className="inline-flex items-center rounded-full bg-[#e6ecf5] p-1">
            {(["monthly", "annual"] as const).map((cycle) => (
              <button
                key={cycle}
                type="button"
                onClick={() => setBillingCycle(cycle)}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-[12px] font-pmedium capitalize transition-all ${
                  billingCycle === cycle ? "bg-white text-[#0f1b35] shadow" : "text-[#60708b] hover:text-[#0f1b35]"
                }`}
              >
                {cycle}
                {cycle === "annual" ? (
                  <span className="rounded-full bg-[#dff5ea] px-2 py-0.5 text-[10px] font-pmedium text-[#16b26a]">
                    Save up to {ANNUAL_SAVE_PERCENT}%
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        <div className={`mx-auto grid grid-cols-1 gap-4 ${options.length > 1 ? "max-w-[640px] md:grid-cols-2" : "max-w-[320px]"}`}>
          {options.map((option) => {
            const isRequested = requestedPlan === option.key;
            const isSubmitting = submittingPlan === option.key;
            return (
              <div
                key={option.key}
                className={`flex w-full flex-col rounded-[30px] border bg-white p-5 shadow-[0_4px_18px_rgba(15,27,53,0.05)] ${
                  option.badge ? "border-[#2563EB] ring-1 ring-[#2563EB]/20" : "border-[#d9e1ec]"
                }`}
              >
                {option.badge ? (
                  <span className="mb-3 inline-flex w-fit rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-pmedium uppercase tracking-widest text-[#2563EB]">
                    {option.badge}
                  </span>
                ) : null}
                <h3 className="text-[16px] font-pmedium text-[#0f1b35]">{option.title}</h3>
                <p className="mt-2 text-[16px] font-pmedium text-[#0f1b35]">{priceLabel(option)}</p>
                <p className="mt-1 text-[11px] font-pmedium text-[#16b26a]">{option.leadAllowance} leads / month</p>
                <p className="mt-2 text-[11px] font-pregular leading-relaxed text-[#667791]">{option.tagline}</p>

                <div className="my-3 h-px bg-[#d8e0ea]" />

                <div className="flex-1 space-y-2">
                  {option.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2">
                      <Check size={13} className="mt-0.5 shrink-0 text-[#23c35c]" />
                      <span className="text-[11px] font-pregular text-[#4f627d]">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={Boolean(submittingPlan)}
                  onClick={() => onRequest(option.key, billingCycle)}
                  className="mt-5 w-full rounded-full bg-[#2563EB] px-4 py-2.5 text-[10px] font-pmedium uppercase tracking-widest text-white transition hover:bg-[#1E3D73] disabled:opacity-60"
                >
                  {isSubmitting ? "Sending…" : isRequested ? "Requested — send again" : option.ctaLabel}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default UpgradePlanModal;
