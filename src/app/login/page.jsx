"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useBranding } from "@/context/BrandingContext";

export default function LoginPage() {
  const { login, user } = useAuth();
  const { leagueName } = useBranding();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      router.push("/");
    } catch {
      setError("Correo o contraseña incorrectos.");
    } finally {
      setBusy(false);
    }
  };

  if (user) {
    return (
      <div className="card px-6 py-12 text-center">
        <p className="h-display text-lg">Ya iniciaste sesión</p>
        <p className="mt-1 text-sm text-muted">{user.email}</p>
        <Link href="/" className="btn-primary mt-4">Ir al inicio</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm space-y-5">
      <div className="flex flex-col items-center gap-3 pt-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" className="h-24 w-24 rounded-3xl object-cover ring-1 ring-line" />
        <div>
          <h1 className="h-display text-2xl">{leagueName}</h1>
          <p className="mt-1 text-sm text-muted">Seguí la liga desde tu celular</p>
        </div>
      </div>

      {/* Camino principal para el fanático: entrar sin cuenta */}
      <Link href="/" className="btn-primary w-full py-3.5 text-base">
        <span className="mi" style={{ fontSize: 20 }}>sports_volleyball</span>
        Explorar la liga
      </Link>
      <p className="text-center text-xs text-muted">
        No necesitás cuenta. Mirá tabla, partidos, estadísticas y equipos libremente.
      </p>

      {/* Acceso de organizadores (colapsado) */}
      <div className="pt-2">
        {!showForm ? (
          <button onClick={() => setShowForm(true)} className="mx-auto flex items-center gap-1.5 text-sm font-semibold text-muted">
            <span className="mi" style={{ fontSize: 18 }}>lock</span>
            Soy organizador · Iniciar sesión
          </button>
        ) : (
          <form onSubmit={submit} className="card space-y-3 p-4">
            <p className="text-sm font-semibold text-snow">Acceso de organizadores</p>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted">Correo</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" required />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted">Contraseña</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" required />
            </label>
            {error && <p className="text-sm text-coral">{error}</p>}
            <button className="btn-primary w-full" disabled={busy}>{busy ? "Entrando…" : "Entrar"}</button>
            <button type="button" onClick={() => setShowForm(false)} className="w-full text-center text-xs text-muted">Cancelar</button>
          </form>
        )}
      </div>
    </div>
  );
}
