"use client";

import { useEffect, useState } from "react";

// Selector de imagen con vista previa. Devuelve el File por onSelect.
export default function PhotoInput({ current, onSelect, label = "Foto", round = true }) {
  const [preview, setPreview] = useState(current || null);

  useEffect(() => {
    setPreview(current || null);
  }, [current]);

  const handle = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onSelect(file);
  };

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border border-line bg-surface ${
          round ? "rounded-full" : "rounded-xl"
        }`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-xl text-muted">📷</span>
        )}
      </div>
      <label className="btn-ghost cursor-pointer">
        {label}
        <input type="file" accept="image/*" className="hidden" onChange={handle} />
      </label>
    </div>
  );
}
