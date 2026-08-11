import React from "react";
import { Check } from "lucide-react";
import FileOrUrlInput from "./FileOrUrlInput";

const PRESET_SEEDS = [
  "thumb-office-1",
  "thumb-laptop-2",
  "thumb-team-3",
  "thumb-books-4",
  "thumb-chart-5",
  "thumb-desk-6",
];

export default function ThumbnailPicker({ value, onChange }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-stone-600">Thumbnail image</label>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {PRESET_SEEDS.map((seed) => {
          const url = `https://picsum.photos/seed/${seed}/240/150`;
          const selected = value === url;
          return (
            <button
              type="button"
              key={seed}
              onClick={() => onChange(url)}
              className={`relative overflow-hidden rounded-lg border-2 transition ${
                selected ? "border-brand-600" : "border-transparent hover:border-stone-300"
              }`}
            >
              <img src={url} alt="Thumbnail option" className="h-14 w-full object-cover" />
              {selected && (
                <span className="absolute inset-0 flex items-center justify-center bg-brand-700/40">
                  <Check size={16} className="text-white" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="mb-1.5 mt-3 text-[11px] text-stone-400">Or provide your own:</p>
      <FileOrUrlInput value={value} onChange={onChange} accept="image/*" kind="image" label={null} />

      {value && (
        <div className="mt-2">
          <img src={value} alt="Selected thumbnail preview" className="h-16 w-24 rounded-lg border border-stone-200 object-cover" />
        </div>
      )}
    </div>
  );
}
