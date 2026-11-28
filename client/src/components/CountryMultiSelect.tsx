import { useEffect, useMemo, useRef, useState } from "react";
import { Country } from "country-state-city";
import { ChevronDown, Search } from "lucide-react";
import { CONTINENT_ORDER, getContinentForCountry } from "../lib/countryContinent";
import { flagUrl } from "../lib/flagUrl";

const allCountries = Country.getAllCountries();
const countriesByContinent = CONTINENT_ORDER.reduce<Record<string, { name: string; isoCode: string }[]>>((acc, continent) => {
  acc[continent] = allCountries
    .filter((country) => getContinentForCountry(country.name) === continent)
    .map((country) => ({ name: country.name, isoCode: country.isoCode }));
  return acc;
}, {});

interface CountryMultiSelectProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  hasError?: boolean;
}

const CountryMultiSelect = ({ value, onChange, placeholder = "Select countries...", hasError }: CountryMultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(value);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  const openPanel = () => {
    setDraft(value);
    setSearch("");
    setOpen(true);
  };

  const query = search.trim().toLowerCase();
  const visibleByContinent = useMemo(() => {
    if (!query) return countriesByContinent;
    const filtered: Record<string, { name: string; isoCode: string }[]> = {};
    CONTINENT_ORDER.forEach((continent) => {
      filtered[continent] = countriesByContinent[continent].filter((country) => country.name.toLowerCase().includes(query));
    });
    return filtered;
  }, [query]);

  const toggleCountry = (name: string) => {
    setDraft((previous) => (previous.includes(name) ? previous.filter((item) => item !== name) : [...previous, name]));
  };

  const toggleContinent = (continent: string) => {
    const names = countriesByContinent[continent].map((country) => country.name);
    const allSelected = names.every((name) => draft.includes(name));
    setDraft((previous) =>
      allSelected ? previous.filter((item) => !names.includes(item)) : Array.from(new Set([...previous, ...names])),
    );
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPanel())}
        className={`flex h-[42px] w-full items-center justify-between rounded-xl border bg-[#f2f4f8] px-3.5 text-[13px] font-pmedium text-slate-700 ${hasError ? "border-rose-500" : "border-[#d2d9e5]"}`}
      >
        <span className={value.length ? "" : "text-slate-500"}>{value.length ? `${value.length} selected` : placeholder}</span>
        <ChevronDown size={16} className="shrink-0 text-[#8d99ad]" />
      </button>

      {open ? (
        <div className="absolute z-30 mt-1.5 w-full rounded-xl border border-[#d2d9e5] bg-white shadow-lg">
          <div className="flex items-center justify-between gap-2 border-b border-[#eef1f6] p-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8d99ad]" />
              <input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search countries..."
                className="h-9 w-full rounded-lg border border-[#d2d9e5] bg-white pl-8 pr-3 text-[12px] font-pmedium text-slate-700 outline-none focus:border-[#2d67f0]"
              />
            </div>
            <span className="shrink-0 text-[11px] font-pmedium text-[#8da0bd]">{draft.length} selected</span>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {CONTINENT_ORDER.map((continent) => {
              const countriesHere = visibleByContinent[continent];
              if (query && countriesHere.length === 0) return null;
              const names = countriesByContinent[continent].map((country) => country.name);
              const selectedCount = names.filter((name) => draft.includes(name)).length;
              const isOpen = Boolean(expanded[continent]) || Boolean(query);
              return (
                <div key={continent} className="border-b border-[#f1f3f7] last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setExpanded((previous) => ({ ...previous, [continent]: !previous[continent] }))}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-[12px] font-pmedium text-[#334155] hover:bg-[#f7f9fc]"
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={names.length > 0 && selectedCount === names.length}
                        onChange={(event) => {
                          event.stopPropagation();
                          toggleContinent(continent);
                        }}
                        onClick={(event) => event.stopPropagation()}
                        className="h-3.5 w-3.5 accent-[#2d67f0]"
                      />
                      {continent}
                    </span>
                    <span className="flex items-center gap-2 text-[11px] text-[#8da0bd]">
                      {selectedCount}/{names.length}
                      <ChevronDown size={14} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </span>
                  </button>
                  {isOpen ? (
                    <div className="space-y-0.5 px-3 pb-2">
                      {countriesHere.map((country) => (
                        <label key={country.name} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-[12px] font-pmedium text-slate-700 hover:bg-[#f2f4f8]">
                          <input
                            type="checkbox"
                            checked={draft.includes(country.name)}
                            onChange={() => toggleCountry(country.name)}
                            className="h-3.5 w-3.5 accent-[#2d67f0]"
                          />
                          <img src={flagUrl(country.isoCode)} alt="" className="h-3 w-4 shrink-0 rounded-[2px] object-cover" />
                          <span className="truncate">{country.name}</span>
                        </label>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-[#eef1f6] p-3">
            <button type="button" onClick={() => setDraft([])} className="text-[12px] font-pmedium text-[#63738d] hover:text-rose-600">
              Clear all
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-[#d2d9e5] px-3.5 py-1.5 text-[12px] font-pmedium text-[#63738d] hover:bg-[#f5f8fc]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange(draft);
                  setOpen(false);
                }}
                className="rounded-lg bg-[#2d67f0] px-3.5 py-1.5 text-[12px] font-pmedium text-white hover:bg-[#2558d5]"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CountryMultiSelect;
