import { Search } from "lucide-react";

export function SearchBar({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="mx-4 mt-6 flex h-16 items-center rounded-full border border-pink-100 bg-white px-5 shadow-card">
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="어디 가시나요? (예: 김녕, 택시, 저녁)"
        className="min-w-0 flex-1 bg-transparent text-[16px] font-semibold text-ink outline-none placeholder:text-neutral-400"
      />
      <Search className="h-7 w-7 text-mingle" />
    </label>
  );
}
