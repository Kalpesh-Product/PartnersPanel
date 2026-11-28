import type { CSSProperties, ElementType, ReactNode } from "react";
import { ArrowRight } from "lucide-react";

/**
 * Full-width inline nudge row ("Want to become a partner of another VAS?",
 * "Need more leads?") — same pattern as HostPanel's plan notices: tinted
 * rounded strip, icon chip, one line of copy and a pill action on the right.
 */
export const UpgradeNotice = ({
  icon: Icon,
  message,
  actionLabel,
  onClick,
  onAction,
}: {
  icon: ElementType;
  message: string;
  actionLabel: string;
  onClick?: () => void;
  onAction?: () => void;
}) => (
  <div
    className={`flex flex-col gap-3 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/80 via-blue-50/40 to-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${onClick ? "cursor-pointer transition hover:border-blue-200" : ""}`}
    onClick={onClick}
  >
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#2563EB] shadow-sm ring-1 ring-blue-100">
        <Icon size={15} />
      </span>
      <p className="text-[12px] font-pmedium leading-relaxed text-[#1E3D73] sm:text-[13px]">{message}</p>
    </div>
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onAction?.();
      }}
      className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-full bg-[#2563EB] px-4 py-2 text-[10px] font-pmedium uppercase tracking-widest text-white shadow-sm transition hover:bg-[#1E3D73] sm:self-center"
    >
      {actionLabel}
      <ArrowRight size={12} />
    </button>
  </div>
);

/**
 * Shared dashboard primitives, ported from HostPanel's
 * pages/Dashboard/FrontendDashboard/dashboard/DashboardShared.tsx so the
 * partner panel renders the same plan-dashboard look: tinted metric tiles,
 * quick-action rows, rounded activity panels and empty states.
 */

export const MetricTile = ({
  icon: Icon,
  label,
  value,
  sub,
  onClick,
  color = "#2563EB",
}: {
  icon: ElementType;
  label: string;
  value: string | number;
  sub?: string;
  onClick?: () => void;
  color?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    style={{ "--metric-color": color } as CSSProperties}
    className="group flex min-w-0 items-center gap-4 rounded-2xl border border-l-4 border-slate-100 border-l-transparent bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[var(--metric-color)] hover:border-l-[var(--metric-color)] hover:shadow-lg"
  >
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-l-2 transition group-hover:bg-[var(--metric-color)] group-hover:text-white"
      style={{ backgroundColor: `${color}14`, borderLeftColor: color, color }}
    >
      <Icon size={19} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[9px] font-pmedium uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <div className="mt-1 flex items-end gap-2">
        <span className="text-2xl font-pmedium leading-none text-[#1E3D73]">{value}</span>
        {sub ? <span className="truncate pb-0.5 text-[10px] font-pmedium text-slate-500">{sub}</span> : null}
      </div>
    </div>
    <ArrowRight size={13} className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[var(--metric-color)]" />
  </button>
);

export const QuickActionTile = ({
  icon: Icon,
  label,
  description,
  onClick,
}: {
  icon: ElementType;
  label: string;
  description: string;
  onClick?: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex min-w-0 items-center gap-3 rounded-2xl border border-blue-100 bg-white p-3.5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
  >
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#2563EB] transition group-hover:bg-[#2563EB] group-hover:text-white">
      <Icon size={17} />
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate text-[12px] font-pmedium text-[#1E3D73]">{label}</p>
      <p className="mt-0.5 truncate text-[10px] font-pmedium text-slate-500">{description}</p>
    </div>
    <ArrowRight size={13} className="shrink-0 text-blue-300 transition group-hover:translate-x-0.5 group-hover:text-[#2563EB]" />
  </button>
);

export const ActivityPanel = ({
  eyebrow,
  title,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) => (
  <section className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white shadow-[0_10px_30px_rgba(30,61,115,0.07)]">
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div>
        <p className="text-[9px] font-pmedium uppercase tracking-[0.2em] text-[#2563EB]">{eyebrow}</p>
        <h3 className="mt-1 text-[15px] font-pmedium text-[#1E3D73]">{title}</h3>
      </div>
      {action}
    </div>
    <div className="flex flex-1 flex-col p-5">{children}</div>
  </section>
);

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: ElementType;
  title: string;
  description: string;
  actionLabel: string;
  onAction?: () => void;
}) => (
  <div className="flex min-h-52 flex-1 flex-col items-center justify-center px-4 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#2563EB]">
      <Icon size={20} />
    </div>
    <p className="mt-3 text-sm font-pmedium text-[#1E3D73]">{title}</p>
    <p className="mt-1 max-w-xs text-[11px] font-pmedium leading-relaxed text-slate-500">{description}</p>
    <button
      type="button"
      onClick={onAction}
      className="group mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#2563EB] px-4 py-2 text-[10px] font-pmedium uppercase tracking-widest text-white transition hover:bg-[#1E3D73]"
    >
      {actionLabel}
      <ArrowRight size={12} className="transition group-hover:translate-x-0.5" />
    </button>
  </div>
);

export const PlanBadge = ({ label, tone = "basic" }: { label: string; tone?: "basic" | "professional" | "custom" }) => {
  const tones: Record<string, string> = {
    basic: "bg-gray-100 text-gray-600 border-gray-300",
    professional: "bg-blue-50 text-blue-700 border-blue-200",
    custom: "bg-violet-50 text-violet-700 border-violet-200",
  };
  return (
    <span className={`inline-flex h-7 shrink-0 items-center justify-center gap-1 rounded-full border px-2.5 text-[11px] font-pmedium uppercase tracking-widest ${tones[tone]}`}>
      {label}
    </span>
  );
};

/**
 * Plan strip pinned to the right of the dashboard masthead: current plan,
 * monthly lead allowance used and the Upgrade Plan entry point (HostPanel
 * renders the same thing as a plan/days-left card next to the greeting).
 */
export const PlanUsageCard = ({
  planLabel,
  leadsUsed,
  leadAllowance,
  pendingPlan,
  onUpgrade,
}: {
  planLabel: string;
  leadsUsed: number;
  leadAllowance: number;
  pendingPlan?: string | null;
  onUpgrade: () => void;
}) => {
  const percent = leadAllowance > 0 ? Math.min(100, Math.round((leadsUsed / leadAllowance) * 100)) : 0;
  return (
    <div className="w-full shrink-0 rounded-2xl border border-blue-100 bg-white/95 p-3.5 shadow-sm backdrop-blur-sm sm:w-60">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[9px] font-pmedium uppercase tracking-[0.18em] text-slate-400">Partner plan</p>
        <button
          type="button"
          onClick={onUpgrade}
          className="rounded-full bg-[#2563EB] px-3 py-1.5 text-[9px] font-pmedium uppercase tracking-widest text-white transition hover:bg-[#1E3D73]"
        >
          Upgrade Plan
        </button>
      </div>
      <p className="mt-1.5 text-lg font-pmedium leading-none text-[#1E3D73]">{planLabel}</p>
      <div className="mt-2 flex items-center justify-between text-[10px] font-pmedium text-slate-500">
        <span>
          {leadsUsed} / {leadAllowance} leads used
        </span>
        <span>{pendingPlan ? `${pendingPlan} pending` : "Resets monthly"}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-blue-100">
        <div className="h-full rounded-full bg-gradient-to-r from-[#1E3D73] to-[#2563EB] transition-all duration-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};
