"use client";

import Link from "next/link";

export default function AppHeader() {
  return (
    <header className="app-header">
      <Link href="/" className="flex items-center gap-2">
        <span className="mi mi-fill text-amber" style={{ fontSize: 28 }}>sports_volleyball</span>
        <span className="h-display text-xl text-amber">Torneo Voley</span>
      </Link>
      <Link href="/cuenta" aria-label="Cuenta y notificaciones" className="text-white/90">
        <span className="mi" style={{ fontSize: 26 }}>notifications</span>
      </Link>
    </header>
  );
}
