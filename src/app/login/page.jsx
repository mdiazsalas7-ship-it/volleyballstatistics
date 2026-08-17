"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/ui";

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

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
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm space-y-5">
      <PageHeader eyebrow="Acceso" title="Iniciar sesión" />
      <form onSubmit={submit} className="card space-y-3 p-4">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">Correo</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" required />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">Contraseña</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" required />
        </label>
        {error && <p className="text-sm text-coral">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "Entrando…" : "Entrar"}
        </button>
      </form>
      <p className="px-1 text-xs text-muted">
        Las cuentas se crean desde la consola de Firebase (Authentication). El administrador asigna el rol de admin en Firestore.
      </p>
    </div>
  );
}
