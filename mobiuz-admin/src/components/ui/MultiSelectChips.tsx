import { Check } from 'lucide-react';

interface MultiSelectChipsProps {
  options: { id: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
  emptyText?: string;
}

/** Bir nechta elementni chip ko'rinishida tanlash (masalan, lavozimlar) */
export default function MultiSelectChips({ options, value, onChange, emptyText }: MultiSelectChipsProps) {
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  if (options.length === 0) {
    return emptyText ? <p className="text-xs text-zinc-500">{emptyText}</p> : null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = value.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={active}
            onClick={() => toggle(o.id)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-extrabold transition ${
              active
                ? 'border-[#ff2b3a]/60 bg-[#ff2b3a]/15 text-white'
                : 'border-white/10 bg-white/[0.04] text-zinc-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            {active && <Check className="h-3.5 w-3.5 text-[#ff6b75]" strokeWidth={3} />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}