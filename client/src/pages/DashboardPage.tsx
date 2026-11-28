import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  FileText,
  HelpCircle,
  MessageCircle,
  Menu,
  Settings,
  Sparkles,
  TicketCheck,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import api from "../lib/axios";
import { logout } from "../redux/slices/authSlice";
import type { RootState } from "../redux/store";
import { PARTNER_SERVICES, type PartnerService } from "../lib/partnerServices";
import { serviceDashboardCopy } from "../lib/partnerDashboard";
import {
  PARTNER_LEAD_ALLOWANCE,
  PARTNER_PLAN_LABELS,
  type PartnerPlanKey,
} from "../lib/partnerPlans";
import { ActivityPanel, EmptyState, MetricTile, PlanUsageCard, QuickActionTile, UpgradeNotice } from "../components/dashboard/DashboardShared";
import UpgradePlanModal from "../components/dashboard/UpgradePlanModal";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import logo from "../assets/WONO_LOGO_Black_TP.svg";

interface PartnerProfile {
  fullName: string;
  email: string;
  plan?: PartnerPlanKey;
  leadsClosed?: number;
  planRequest?: { plan: string; billingCycle: string; status: string } | null;
  services: Array<{
    service: PartnerService;
    companyName?: string;
    countryOfOrigin?: string;
    state?: string;
    city?: string;
    address?: string;
    servicesOffered?: string[];
  }>;
}

// Same masthead / pulse / quick-actions / activity composition as HostPanel's
// plan dashboards (BasicDashboard, DashboardShared), using the partner's
// approved VAS list instead of plan-gated modules.
const greetingForNow = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

const todayLabel = () =>
  new Intl.DateTimeFormat("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());

const DashboardPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [submittingPlan, setSubmittingPlan] = useState<string | null>(null);

  useEffect(() => {
    api.get("/partners/me").then((res) => {
      const partner = res.data.data as PartnerProfile;
      const isIncomplete = partner.services.length === 0 || partner.services.some((service) => !service.companyName || !service.countryOfOrigin || !service.state || !service.city || !service.address);
      if (isIncomplete) {
        navigate("/create-account", { replace: true });
        return;
      }
      setProfile(partner);
    }).finally(() => setCheckingProfile(false));
  }, [navigate]);

  const services = useMemo(() => profile?.services.map((entry) => entry.service) || [], [profile]);
  const isMultiService = services.length > 1;

  const handleLogout = async () => {
    try { await api.post("/auth/logout"); }
    finally { dispatch(logout()); navigate("/", { replace: true }); }
  };

  const handlePlanRequest = async (plan: string, billingCycle: "monthly" | "annual") => {
    setSubmittingPlan(plan);
    try {
      const { data } = await api.post("/partners/me/plan-request", { plan, billingCycle });
      setProfile((current) => (current ? { ...current, planRequest: data?.data ?? { plan, billingCycle, status: "pending" } } : current));
      setUpgradeOpen(false);
      toast.success(`Upgrade request for the ${plan} plan sent to the WONO team.`);
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || "Could not send the upgrade request. Please try again.");
    } finally {
      setSubmittingPlan(null);
    }
  };

  if (checkingProfile || !profile) return <div className="flex min-h-screen items-center justify-center font-pmedium text-sm text-slate-500">Loading your partner account…</div>;

  const ownerName = profile.fullName || user?.fullName || "Partner";
  const firstName = ownerName.split(" ")[0];
  const plan = profile.plan || "free";
  const planLabel = PARTNER_PLAN_LABELS[plan];
  const leadAllowance = PARTNER_LEAD_ALLOWANCE[plan];
  const leadsUsed = profile.leadsClosed || 0;
  const pendingPlan = profile.planRequest?.status === "pending" ? PARTNER_PLAN_LABELS[profile.planRequest.plan as PartnerPlanKey] : null;
  const hasUpgrades = plan !== "growth";

  const primaryService = profile.services[0];
  const serviceLocation = primaryService
    ? [primaryService.city, primaryService.state, primaryService.countryOfOrigin].filter(Boolean).join(", ")
    : "";

  const availableServices = PARTNER_SERVICES.filter((service) => !services.includes(service));

  const summaryCards = [
    { label: isMultiService ? "Active VAS Partnerships" : `New ${serviceDashboardCopy[services[0]].short} Leads`, value: isMultiService ? services.length : 0, sub: isMultiService ? "Approved services" : "No new leads yet", icon: BriefcaseBusiness, color: "#2563EB" },
    { label: "Total Leads", value: 0, sub: "Live activity appears here", icon: CalendarDays, color: "#059669" },
    { label: "Open Requests", value: 0, sub: "Nothing pending", icon: TicketCheck, color: "#EA580C" },
    { label: "In Progress", value: 0, sub: "Queue is clear", icon: Clock3, color: "#7C3AED" },
    { label: "Commission Earned", value: "$0", sub: "This month", icon: Wallet, color: "#0891B2" },
    { label: "Pending Payout", value: "$0", sub: "Next settlement", icon: CircleDollarSign, color: "#DB2777" },
  ];

  const quickLinks = [
    { key: "support", label: "Customer Support", description: "Handle open support tickets", icon: HelpCircle },
    ...services.flatMap((service) => {
      const copy = serviceDashboardCopy[service];
      return [
        { key: `${service}-leads`, label: copy.lead, description: "View and manage leads", icon: ClipboardList },
        { key: `${service}-requests`, label: copy.request, description: "Manage service requests", icon: TicketCheck },
        { key: `${service}-wallet`, label: `${copy.short} Commission Wallet`, description: "Track commission balance", icon: Wallet },
        { key: `${service}-analytics`, label: copy.analytics, description: "View service analytics", icon: BarChart3 },
      ];
    }),
  ];

  const hasServicesOffered = profile.services.every((entry) => (entry.servicesOffered?.length || 0) > 0);
  const steps = [
    { icon: FileText, label: "Complete your partner profile", description: "Business details for every approved service.", complete: true },
    { icon: ClipboardList, label: "Declare the services you offer", description: "Tell WONO what you can deliver in each market.", complete: hasServicesOffered },
    { icon: Users, label: "Respond to your first lead", description: "New opportunities land here in real time.", complete: false },
    { icon: Wallet, label: "Review your commission wallet", description: "See what you have earned so far.", complete: false },
  ];
  const completedCount = steps.filter((step) => step.complete).length;
  const progress = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#F7F8FA]">
      {/* Header: the logo sits in a rail-width column so it lines up with the
          sidebar below it, and the actions line up with the content column. */}
      <header className="w-full shrink-0 bg-white shadow-md">
        <div className="flex w-full items-center justify-between gap-x-6 py-2 pr-4">
          <div className="flex w-full max-w-[16rem] shrink-0 items-center gap-3 pl-4 lg:w-64">
            <img src={logo} alt="WONO" className="h-11 max-w-[70%] cursor-pointer object-contain" />
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-lg text-gray-500 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>
          </div>
          <div className="flex w-fit items-center gap-3">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-600 transition-colors hover:bg-gray-100"
              aria-label="Settings"
            >
              <Settings size={18} />
            </button>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1E3D73] font-pmedium text-xs text-white">{ownerName.charAt(0)}</span>
              <div className="hidden leading-tight sm:block">
                <p className="font-pmedium text-[14px] text-slate-900">{ownerName}</p>
                <p className="mt-0.5 font-pmedium text-[11px] capitalize text-slate-500">Partner</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 w-full flex-1">
        <aside className="hidden w-64 shrink-0 lg:block">
          <Sidebar services={services} onSignOut={handleLogout} />
        </aside>

        {sidebarOpen ? (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="flex h-full w-64 flex-col overflow-y-auto">
              <Sidebar services={services} onSignOut={handleLogout} />
            </div>
            <button type="button" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)} className="flex-1 bg-[#0f172a]/45 backdrop-blur-[2px]">
              <span className="sr-only">Close</span>
            </button>
            <button type="button" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar" className="absolute left-[16rem] top-3 rounded-md bg-white/90 p-1.5 text-gray-700">
              <X size={16} />
            </button>
          </div>
        ) : null}

        {/* Content column scrolls on its own; the sidebar keeps its own scroll. */}
        <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-y-auto">
          <main className="flex w-full flex-col gap-2 bg-[#F7F8FA] p-3">
            <div className="flex items-center gap-2 rounded-t-md bg-white px-4 py-3.5 text-xs">
              <span className="font-pregular text-gray-500">Partners Panel</span>
              <ChevronRight size={14} className="text-gray-400" />
              <span className="font-pmedium text-[#1E3D73]">Dashboard</span>
            </div>

            <div className="min-w-0 bg-white">
              <div className="min-w-0 bg-slate-50/40 p-2 lg:p-2.5" data-tour="page-content">
                <div className="flex flex-col gap-3">
                  <section className="relative overflow-hidden rounded-[1.75rem] border border-blue-100 bg-gradient-to-br from-blue-50/80 via-white to-white p-5 shadow-[0_12px_34px_rgba(37,99,235,0.08)] sm:p-6">
                    <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-100/70" />
                    <div className="pointer-events-none absolute -bottom-24 right-40 h-56 w-56 rounded-full bg-blue-50/70" />
                    <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h1 className="text-lg font-pmedium uppercase tracking-[0.06em] text-[#1E3D73] sm:text-xl">Dashboard</h1>
                          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[9px] font-pmedium uppercase tracking-widest text-slate-500 shadow-sm">
                            <HelpCircle size={11} /> Guide
                          </span>
                          <span className="rounded-full border border-blue-100 bg-white px-2.5 py-1 text-[9px] font-pmedium uppercase tracking-widest text-[#2563EB] shadow-sm">
                            Active Partner
                          </span>
                        </div>
                        <h2 className="mt-2.5 text-xl font-pmedium text-[#1E3D73] sm:text-2xl">
                          {greetingForNow()}, {firstName} 👋
                        </h2>
                        <p className="mt-1 text-xs font-pmedium text-slate-500 sm:text-sm">
                          {todayLabel()}
                          {serviceLocation ? ` — ${serviceLocation}` : ""}
                        </p>
                      </div>
                      <PlanUsageCard
                        planLabel={planLabel}
                        leadsUsed={leadsUsed}
                        leadAllowance={leadAllowance}
                        pendingPlan={pendingPlan}
                        onUpgrade={() => setUpgradeOpen(true)}
                      />
                    </div>
                  </section>

                  <div className="flex flex-col gap-2">
                    {availableServices.length > 0 ? (
                      <UpgradeNotice
                        icon={Zap}
                        message="Want to become a partner of another Value Added Service?"
                        actionLabel="Request Access"
                        onAction={() => {
                          window.location.href = "mailto:response@wono.co?subject=Request%20access%20to%20another%20Value%20Added%20Service";
                        }}
                      />
                    ) : null}
                    {hasUpgrades ? (
                      <UpgradeNotice
                        icon={Sparkles}
                        message="Need more leads? Upgrade your partner plan to receive more leads each month."
                        actionLabel="Upgrade Plan"
                        onAction={() => setUpgradeOpen(true)}
                      />
                    ) : null}
                  </div>

                  <section data-tour="dashboard-getting-started" className="overflow-hidden rounded-[1.75rem] border border-blue-100 bg-gradient-to-br from-white via-white to-blue-50/80 p-5 shadow-[0_12px_34px_rgba(30,61,115,0.08)] sm:p-6">
                    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="inline-flex items-center gap-1.5 text-[10px] font-pmedium uppercase tracking-[0.2em] text-[#2563EB]">
                          <Sparkles size={12} /> Partners progress
                        </p>
                        <h3 className="mt-1 text-lg font-pmedium text-[#1E3D73]">Finish the essentials</h3>
                        <p className="mt-1 text-xs font-pmedium text-slate-500">Complete the first actions that make this dashboard useful.</p>
                      </div>
                      <div className="min-w-[170px]">
                        <div className="mb-1.5 flex items-center justify-between text-[10px] font-pmedium uppercase tracking-widest">
                          <span className="text-slate-400">Setup</span>
                          <span className="text-[#2563EB]">{progress}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-blue-100">
                          <div className="h-full rounded-full bg-gradient-to-r from-[#1E3D73] to-[#2563EB] transition-all duration-500" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {steps.map((step) => {
                        const StepIcon = step.icon;
                        return (
                          <div
                            key={step.label}
                            className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${step.complete ? "border-emerald-100 bg-emerald-50/60" : "border-slate-100 bg-white shadow-sm hover:border-blue-200"}`}
                          >
                            <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${step.complete ? "bg-emerald-500 text-white" : "bg-blue-50 text-[#2563EB]"}`}>
                              {step.complete ? <Check size={16} /> : <StepIcon size={16} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-pmedium text-slate-900">{step.label}</p>
                              <p className="mt-1 text-[11px] font-pmedium leading-relaxed text-slate-500">{step.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  <section data-tour="dashboard-overview" className="rounded-[1.75rem] border border-blue-100 bg-[#F8FAFD] p-5 shadow-[0_12px_34px_rgba(30,61,115,0.06)] sm:p-6">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1E3D73] text-white shadow-sm">
                          <Activity size={18} />
                        </div>
                        <div>
                          <p className="text-[9px] font-pmedium uppercase tracking-[0.2em] text-[#2563EB]">Live partner</p>
                          <h3 className="mt-0.5 text-lg font-pmedium text-[#1E3D73]">Partner Pulse</h3>
                        </div>
                      </div>
                      <button type="button" className="inline-flex items-center gap-1.5 rounded-full bg-[#2563EB] px-4 py-2 text-[10px] font-pmedium uppercase tracking-widest text-white transition hover:bg-[#1E3D73]">
                        <Zap size={13} /> Request Access <ArrowRight size={12} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {summaryCards.map((card) => <MetricTile key={card.label} {...card} />)}
                    </div>
                  </section>

                  <section data-tour="dashboard-quick-links" className="relative overflow-hidden rounded-[1.75rem] border border-blue-100 bg-gradient-to-br from-blue-50/80 via-white to-white p-5 shadow-[0_12px_34px_rgba(37,99,235,0.08)] sm:p-6">
                    <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-100/70" />
                    <div className="relative mb-5">
                      <p className="text-[9px] font-pmedium uppercase tracking-[0.2em] text-[#2563EB]">Jump back in</p>
                      <h3 className="mt-1 text-lg font-pmedium text-[#1E3D73]">Quick Actions</h3>
                      <p className="mt-1 text-xs font-pmedium text-slate-500">Open the tools included in your partner account.</p>
                    </div>
                    <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {quickLinks.map(({ key, ...link }) => <QuickActionTile key={key} {...link} />)}
                    </div>
                  </section>

                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <div data-tour="dashboard-recent-leads">
                      <ActivityPanel eyebrow="Lead activity" title="Recent Leads">
                        <EmptyState
                          icon={ClipboardList}
                          title="No leads yet"
                          description="New WONO opportunities for your approved services will appear here automatically."
                          actionLabel="View all leads"
                        />
                      </ActivityPanel>
                    </div>
                    <div data-tour="dashboard-requests">
                      <ActivityPanel eyebrow="Service desk" title="Open Requests">
                        <EmptyState
                          icon={TicketCheck}
                          title="Nothing in the queue"
                          description="Client requests for your services land here and can be tracked until completion."
                          actionLabel="View all requests"
                        />
                      </ActivityPanel>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>

          <Footer />
        </div>
      </div>

      <button type="button" aria-label="Chat with partner support" className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-lg transition-transform hover:scale-105 hover:bg-[#1E3D73]">
        <MessageCircle size={20} />
      </button>

      {upgradeOpen ? (
        <UpgradePlanModal
          currentPlan={plan}
          requestedPlan={profile.planRequest?.status === "pending" ? profile.planRequest.plan : null}
          submittingPlan={submittingPlan}
          onClose={() => setUpgradeOpen(false)}
          onRequest={handlePlanRequest}
        />
      ) : null}
    </div>
  );
};

export default DashboardPage;
