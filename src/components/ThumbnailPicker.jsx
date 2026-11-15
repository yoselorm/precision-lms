import React from "react";
import FileOrUrlInput from "./FileOrUrlInput";

// Course thumbnail: upload an image or paste its URL, with a preview.
export default function ThumbnailPicker({ value, onChange }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-stone-600">Thumbnail image</label>
      <FileOrUrlInput value={value} onChange={onChange} accept="image/*" kind="image" label={null} />

      {value && (
        <div className="mt-2">
          <img src={value} alt="Selected thumbnail preview" className="h-16 w-24 rounded-lg border border-stone-200 object-cover" />
        </div>
      )}
    </div>
  );
}
