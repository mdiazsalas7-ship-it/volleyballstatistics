"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, Spinner } from "@/components/ui";
import Link from "next/link";

export default function AccountPage() {
  const { user, role, isAdmin, logout, loading } = useAuth();
  const router = useRouter();

  if (loading) return <Spinner />;
  if (!user) {
    return (
      <div className="card px-6 py-12 text-center">
        <p className="h-display text-lg">No hay sesión activa</p>
        <Link href="/login" className="btn-primary mt-4">Entrar</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Perfil" title="Mi cuenta" />
      <div className="card space-y-2 p-4">
        <Row label="Correo" value={user.email} />
        <Row label="Rol" value={isAdmin ? "Administrador" : "Visitante"} />
      </div>
      <button
        onClick={async () => { await logout(); router.push("/"); }}
        className="btn-ghost w-full text-coral"
      >
        Cerrar sesión
      </button>
      {!isAdmin && (
        <p className="px-1 text-xs text-muted">
          Como visitante podés ver posiciones, calendario, resultados y estadísticas.
        </p>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-semibold text-ink">{value}</span>
    </div>
  );
}
