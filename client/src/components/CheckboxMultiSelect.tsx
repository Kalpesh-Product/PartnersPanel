import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

interface CheckboxMultiSelectProps {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  hasError?: boolean;
}

const CheckboxMultiSelect = ({ options, value, onChange, placeholder = "Select options...", hasError }: CheckboxMultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  const toggle = (option: string) => {
    onChange(value.includes(option) ? value.filter((item) => item !== option) : [...value, option]);
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        className={`flex h-[42px] w-full items-center justify-between rounded-xl border bg-[#f2f4f8] px-3.5 text-[13px] font-pmedium text-slate-700 ${hasError ? "border-rose-500" : "border-[#d2d9e5]"}`}
      >
        <span className={`truncate text-left ${value.length ? "" : "text-slate-500"}`}>{value.length ? value.join(", ") : placeholder}</span>
        <ChevronDown size={16} className="shrink-0 text-[#8d99ad]" />
      </button>

      {open ? (
        <div className="absolute z-30 mt-1.5 w-full rounded-xl border border-[#d2d9e5] bg-white shadow-lg">
          <div className="max-h-60 overflow-y-auto p-2">
            {options.map((option) => (
              <label
                key={option}
                className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-pmedium ${value.includes(option) ? "bg-[#eaf1ff] text-[#2d67f0]" : "text-slate-700 hover:bg-[#f2f4f8]"}`}
              >
                <input type="checkbox" checked={value.includes(option)} onChange={() => toggle(option)} className="h-3.5 w-3.5 accent-[#2d67f0]" />
                {option}
              </label>
            ))}
          </div>
          <div className="border-t border-[#eef1f6] p-2 text-right">
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg bg-[#2d67f0] px-4 py-1.5 text-[12px] font-pmedium text-white hover:bg-[#2558d5]">
              Done
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CheckboxMultiSelect;
