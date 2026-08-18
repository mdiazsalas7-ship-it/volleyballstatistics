"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { watchBranding } from "@/lib/data";

const DEFAULTS = { leagueName: "Torneo Voley", logoUrl: null };

const BrandingContext = createContext(DEFAULTS);

export function BrandingProvider({ children }) {
  const [branding, setBranding] = useState(DEFAULTS);

  useEffect(() => {
    const unsub = watchBranding((b) => {
      setBranding({
        leagueName: b?.leagueName || DEFAULTS.leagueName,
        logoUrl: b?.logoUrl || null,
      });
    });
    return () => unsub();
  }, []);

  return <BrandingContext.Provider value={branding}>{children}</BrandingContext.Provider>;
}

export function useBranding() {
  return useContext(BrandingContext);
}
