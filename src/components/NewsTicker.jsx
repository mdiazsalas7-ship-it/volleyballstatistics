"use client";

import { useEffect, useRef } from "react";

const SPEED = 0.55; // px por frame

const COLOR = {
  envivo: "#FF5A5F",
  noticia: "#60A5FA",
  resultado: "#22D3A0",
  proximo: "#A78BFA",
  lider: "#FFC043",
};

// items: [{ type, text }]
export default function NewsTicker({ items = [] }) {
  const trackRef = useRef(null);
  const posRef = useRef(0);
  const rafRef = useRef(0);
  const pauseRef = useRef(false);

  useEffect(() => {
    if (!items.length) return;
    const track = trackRef.current;
    if (!track) return;
    posRef.current = 0;
    const t = setTimeout(() => {
      const half = track.scrollWidth / 2;
      const step = () => {
        if (!pauseRef.current && half > 0) {
          posRef.current += SPEED;
          if (posRef.current >= half) posRef.current -= half;
          track.style.transform = `translateX(-${posRef.current}px)`;
        }
        rafRef.current = requestAnimationFrame(step);
      };
      rafRef.current = requestAnimationFrame(step);
    }, 120);
    return () => { clearTimeout(t); cancelAnimationFrame(rafRef.current); };
  }, [items]);

  if (!items.length) return null;
  const loop = [...items, ...items]; // para bucle infinito

  return (
    <div
      className="-mx-4 mb-4 flex h-9 items-center overflow-hidden border-y border-line bg-ink"
      style={{ backgroundImage: "radial-gradient(120% 200% at 0% 50%, rgba(47,107,255,.18), transparent 40%)" }}
    >
      <div className="flex h-full shrink-0 items-center gap-1.5 border-r border-line bg-court/15 px-3">
        <span className="mi mi-fill text-amber" style={{ fontSize: 15 }}>bolt</span>
        <span className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-amber">En Directo</span>
      </div>
      <div
        className="relative flex-1 overflow-hidden"
        onTouchStart={() => (pauseRef.current = true)}
        onTouchEnd={() => setTimeout(() => (pauseRef.current = false), 1500)}
      >
        <div ref={trackRef} className="flex items-center whitespace-nowrap will-change-transform">
          {loop.map((it, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 pr-9">
              <span
                className={it.type === "envivo" ? "animate-live" : ""}
                style={{ color: COLOR[it.type] || "#8FA6C9", fontSize: 7 }}
              >
                ●
              </span>
              <span
                className="text-[11px] font-bold tracking-tight"
                style={{ color: COLOR[it.type] || "#8FA6C9" }}
              >
                {it.text}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
