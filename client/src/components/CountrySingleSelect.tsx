import { useEffect, useRef, useState } from "react";
import { Country } from "country-state-city";
import { ChevronDown, Search } from "lucide-react";
import { flagUrl } from "../lib/flagUrl";

const allCountries = Country.getAllCountries();

interface CountrySingleSelectProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  hasError?: boolean;
  disabled?: boolean;
}

// Same custom dropdown as CountryMultiSelect (flag images instead of emoji,
// which native <select><option> can't render and Windows often fails to
// show as actual flags), just single-select with no Apply/Cancel step.
const CountrySingleSelect = ({ value, onChange, placeholder = "Select country", hasError, disabled }: CountrySingleSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  const selected = allCountries.find((country) => country.name === value);
  const query = search.trim().toLowerCase();
  const visibleCountries = query ? allCountries.filter((country) => country.name.toLowerCase().includes(query)) : allCountries;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setSearch("");
          setOpen((previous) => !previous);
        }}
        className={`flex h-[42px] w-full items-center justify-between rounded-xl border bg-[#f2f4f8] px-3.5 text-[13px] font-pmedium text-slate-700 disabled:opacity-70 ${hasError ? "border-rose-500" : "border-[#d2d9e5]"}`}
      >
        <span className={`flex min-w-0 items-center gap-2 ${value ? "" : "text-slate-500"}`}>
          {selected ? <img src={flagUrl(selected.isoCode)} alt="" className="h-3 w-4 shrink-0 rounded-[2px] object-cover" /> : null}
          <span className="truncate">{value || placeholder}</span>
        </span>
        <ChevronDown size={16} className="shrink-0 text-[#8d99ad]" />
      </button>

      {open ? (
        <div className="absolute z-30 mt-1.5 w-full rounded-xl border border-[#d2d9e5] bg-white shadow-lg">
          <div className="relative border-b border-[#eef1f6] p-2.5">
            <Search size={14} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#8d99ad]" />
            <input
              autoFocus
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search countries..."
              className="h-9 w-full rounded-lg border border-[#d2d9e5] bg-white pl-8 pr-3 text-[12px] font-pmedium text-slate-700 outline-none focus:border-[#2d67f0]"
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1.5">
            {visibleCountries.map((country) => (
              <button
                type="button"
                key={country.isoCode}
                onClick={() => {
                  onChange(country.name);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12px] font-pmedium hover:bg-[#f2f4f8] ${country.name === value ? "bg-[#eaf1ff] text-[#2d67f0]" : "text-slate-700"}`}
              >
                <img src={flagUrl(country.isoCode)} alt="" className="h-3 w-4 shrink-0 rounded-[2px] object-cover" />
                <span className="truncate">{country.name}</span>
              </button>
            ))}
            {visibleCountries.length === 0 ? <p className="px-2.5 py-3 text-[12px] font-pmedium text-slate-500">No countries found.</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CountrySingleSelect;
