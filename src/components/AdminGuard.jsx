"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Spinner } from "@/components/ui";

export default function AdminGuard({ children }) {
  const { loading, user, isAdmin } = useAuth();
  if (loading) return <Spinner />;

  if (!user) {
    return (
      <div className="card px-6 py-12 text-center">
        <p className="h-display text-lg">Necesitás iniciar sesión</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          La mesa técnica es solo para administradores del torneo.
        </p>
        <Link href="/login" className="btn-primary mt-4">Entrar</Link>
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="card px-6 py-12 text-center">
        <p className="h-display text-lg">Acceso restringido</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          Tu cuenta es de visitante. Pedile al administrador que te asigne el rol de admin.
        </p>
      </div>
    );
  }
  return children;
}
