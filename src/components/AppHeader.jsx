"use client";

import Link from "next/link";
import { useBranding } from "@/context/BrandingContext";
import { useAuth } from "@/context/AuthContext";

export default function AppHeader() {
  const { leagueName, logoUrl } = useBranding();
  const { user } = useAuth();

  return (
    <header className="app-header">
      <Link href="/" className="flex min-w-0 items-center gap-2">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <span className="mi mi-fill text-amber" style={{ fontSize: 28 }}>sports_volleyball</span>
        )}
        <span className="h-display truncate text-xl text-amber">{leagueName}</span>
      </Link>
      <Link href={user ? "/cuenta" : "/login"} aria-label="Cuenta" className="shrink-0 text-white/90">
        <span className="mi" style={{ fontSize: 26 }}>account_circle</span>
      </Link>
    </header>
  );
}
