import { useState } from "react";
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Headphones,
  LayoutDashboard,
  LogOut,
  Search,
  TicketCheck,
  User,
  UsersRound,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { SERVICE_LABELS, type PartnerService } from "../lib/partnerServices";
import { serviceDashboardCopy } from "../lib/partnerDashboard";

// HostPanel sidebar styling: #efefef rail, plan pill, module search, uppercase
// collapsible sections split by hairlines, and rows that become a white pill
// with an accent icon when active. Typography uses the project's registered
// Poppins faces (font-pmedium) — the literal "Poppins" family is not declared
// in this app, so using it silently fell back to a system font.
//
// The rail now owns its scroll: the header stays put, the module list scrolls,
// and Profile / Sign Out sit in a fixed footer block, so the sidebar scrolls
// independently from the dashboard content beside it.

interface SidebarProps {
  services: PartnerService[];
  activeItem?: string;
  onSignOut: () => void;
}

interface NavItemProps {
  label: string;
  icon?: LucideIcon;
  depth?: number;
  active?: boolean;
  red?: boolean;
  hasChildren?: boolean;
  isOpen?: boolean;
  onClick?: () => void;
}

const NavItem = ({ label, icon: Icon, depth = 0, active = false, red = false, hasChildren = false, isOpen = false, onClick }: NavItemProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`group flex w-full items-center gap-2 rounded-md text-left transition-all hover:bg-white ${
      active ? "bg-white text-black shadow-sm" : "text-black/80"
    } ${red ? "text-red-500 hover:text-red-600" : ""} ${hasChildren ? "py-2.5 pr-1" : "py-2.5 pr-3"}`}
    style={{ paddingLeft: `${depth * 1.25 + 0.75}rem` }}
  >
    {Icon ? <Icon size={18} className={`shrink-0 ${red ? "text-red-500" : active ? "text-[#2563EB]" : "text-black/80"}`} /> : null}
    <span className={`truncate text-[12px] tracking-[0.01em] ${active ? "font-pmedium" : "font-pregular"}`}>{label}</span>
    {hasChildren ? (
      isOpen ? (
        <ChevronUp size={16} className="ml-auto shrink-0 text-black/55" />
      ) : (
        <ChevronDown size={16} className="ml-auto shrink-0 text-black/55" />
      )
    ) : null}
  </button>
);

const SectionHeading = ({ title, isOpen, onClick }: { title: string; isOpen: boolean; onClick: () => void }) => (
  <button type="button" onClick={onClick} className="flex w-full items-center justify-between text-left">
    <span className="font-pmedium text-[11px] uppercase tracking-[0.12em] text-black/70">{title}</span>
    {isOpen ? <ChevronUp size={16} className="shrink-0 text-black/60" /> : <ChevronDown size={16} className="shrink-0 text-black/60" />}
  </button>
);

const Sidebar = ({ services, activeItem = "dashboard", onSignOut }: SidebarProps) => {
  const [moduleSearch, setModuleSearch] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ vas: true });
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(services.map((service) => [service, true])),
  );
  const searching = Boolean(moduleSearch.trim());
  const query = moduleSearch.trim().toLowerCase();
  const isSectionOpen = (key: string) => openSections[key] ?? true;
  const matches = (...labels: string[]) => !query || labels.some((label) => label.toLowerCase().includes(query));

  const commonItems = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "support", label: "Customer Support", icon: Headphones },
  ].filter((item) => matches(item.label));

  const serviceGroups = services
    .map((service) => {
      const copy = serviceDashboardCopy[service];
      const children = [
        { key: `${service}-leads`, label: copy.lead, icon: ClipboardList },
        { key: `${service}-requests`, label: copy.request, icon: TicketCheck },
        { key: `${service}-wallet`, label: `${copy.short} Commission Wallet`, icon: Wallet },
        { key: `${service}-analytics`, label: copy.analytics, icon: BarChart3 },
      ].filter((child) => matches(child.label));
      return { service, copy, children };
    })
    .filter((group) => matches(SERVICE_LABELS[group.service]) || group.children.length > 0);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden border-r border-black/10 bg-[#efefef]">
      <div className="flex shrink-0 justify-center px-4 py-3">
        <span className="rounded-full bg-white px-3 py-1 font-pmedium text-[10px] uppercase tracking-[0.12em] text-black/70">Partners Panel</span>
      </div>

      <div className="shrink-0 px-4 pb-2">
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            name="sidebar-module-search"
            value={moduleSearch}
            onChange={(event) => setModuleSearch(event.target.value)}
            placeholder="Search modules"
            aria-label="Search modules"
            autoComplete="off"
            className="h-9 w-full rounded-md border border-black/15 bg-white pl-9 pr-8 font-pmedium text-xs text-slate-800 outline-none transition-colors placeholder:text-slate-500 focus:border-[#1E3D73] focus:ring-2 focus:ring-[#1E3D73]/15"
          />
          {moduleSearch ? (
            <button
              type="button"
              onClick={() => setModuleSearch("")}
              aria-label="Clear module search"
              className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded text-slate-500 hover:bg-black/5 hover:text-black/70"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex-1 space-y-0 overflow-y-auto pb-3">
        <div className="px-4 pt-1">
          <div className="space-y-1">
            {commonItems.map(({ key, label, icon }) => (
              <NavItem key={key} label={label} icon={icon} active={activeItem === key} />
            ))}
          </div>
        </div>

        {serviceGroups.length > 0 ? (
          <div className="px-4 pt-3">
            <div className="border-t border-black/10 pt-2">
              <SectionHeading
                title="Value Added Services"
                isOpen={searching || isSectionOpen("vas")}
                onClick={() => setOpenSections((current) => ({ ...current, vas: !isSectionOpen("vas") }))}
              />
              {searching || isSectionOpen("vas") ? (
                <div className="mt-1 space-y-1">
                  {serviceGroups.map(({ service, children }) => {
                    const groupOpen = searching || openGroups[service];
                    return (
                      <div key={service}>
                        <NavItem
                          label={SERVICE_LABELS[service]}
                          icon={UsersRound}
                          hasChildren
                          isOpen={groupOpen}
                          onClick={() => {
                            if (searching) return;
                            setOpenGroups((current) => ({ ...current, [service]: !groupOpen }));
                          }}
                        />
                        {groupOpen ? (
                          <div className="space-y-1">
                            {children.map(({ key, label, icon }) => (
                              <NavItem key={key} label={label} icon={icon} depth={1} active={activeItem === key} />
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {/* Profile / Sign Out live directly in the rail footer (no "General"
          section heading) so they stay reachable while the list scrolls. */}
      <div className="shrink-0 px-4 pb-3">
        <div className="border-t border-black/10 pt-2">
          <div className="space-y-1">
            <NavItem label="Profile" icon={User} />
            <NavItem label="Sign Out" icon={LogOut} red onClick={onSignOut} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
