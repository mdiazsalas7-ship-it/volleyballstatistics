"use client";

import { firebaseReady } from "@/lib/firebase";

export default function ConfigBanner() {
  if (firebaseReady) return null;
  return (
    <div className="mb-4 rounded-xl border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-ink">
      <p className="font-semibold text-coral">Falta configurar Firebase</p>
      <p className="mt-1 text-muted">
        No se detectaron las variables <code>NEXT_PUBLIC_FIREBASE_*</code>. Cargalas en
        Vercel (Settings → Environment Variables) y volvé a desplegar. Ver
        <span className="font-medium"> DEPLOY-VERCEL.md</span>.
      </p>
    </div>
  );
}
