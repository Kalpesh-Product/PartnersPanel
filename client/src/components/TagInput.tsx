import { useState } from "react";
import { X } from "lucide-react";

interface TagInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}

const TagInput = ({ value, onChange, placeholder = "Type and press Enter" }: TagInputProps) => {
  const [draft, setDraft] = useState("");

  const addTag = () => {
    const tag = draft.trim();
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setDraft("");
  };

  return (
    <div className="flex min-h-[42px] w-full flex-wrap items-center gap-1.5 rounded-xl border border-[#d2d9e5] bg-[#f2f4f8] px-2.5 py-1.5">
      {value.map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-lg bg-[#dce9ff] px-2 py-1 text-[11px] font-pmedium text-[#233552]">
          {tag}
          <button type="button" onClick={() => onChange(value.filter((item) => item !== tag))} aria-label={`Remove ${tag}`}>
            <X size={12} />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            addTag();
          }
        }}
        onBlur={addTag}
        placeholder={value.length ? "" : placeholder}
        className="min-w-[120px] flex-1 bg-transparent text-[13px] font-pmedium text-slate-700 outline-none placeholder:text-slate-500"
      />
    </div>
  );
};

export default TagInput;
