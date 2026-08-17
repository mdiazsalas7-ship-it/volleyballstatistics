"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, Spinner } from "@/components/ui";
import InstallPWA from "@/components/InstallPWA";
import NotificationToggle from "@/components/NotificationToggle";
import { sendBroadcast } from "@/lib/messaging";

export default function AccountPage() {
  const { user, isAdmin, logout, loading } = useAuth();
  const router = useRouter();

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Perfil" title="Mi cuenta" />

      {/* Instalación disponible para todos */}
      <InstallPWA />
      <NotificationToggle />

      {user ? (
        <>
          <div className="card space-y-2 p-4">
            <Row label="Correo" value={user.email} />
            <Row label="Rol" value={isAdmin ? "Administrador" : "Visitante"} />
          </div>

          {isAdmin && <BroadcastForm user={user} />}

          <button
            onClick={async () => { await logout(); router.push("/"); }}
            className="btn-ghost w-full text-coral"
          >
            Cerrar sesión
          </button>
        </>
      ) : (
        <div className="card px-6 py-8 text-center">
          <p className="text-sm text-muted">No has iniciado sesión.</p>
          <Link href="/login" className="btn-primary mt-3">Entrar</Link>
        </div>
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

function BroadcastForm({ user }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [state, setState] = useState("idle");
  const [msg, setMsg] = useState("");

  const send = async () => {
    setState("loading");
    setMsg("");
    try {
      const res = await sendBroadcast(user, title, body);
      setState("done");
      setMsg(`Aviso enviado a ${res.sent} dispositivo(s).`);
      setTitle("");
      setBody("");
    } catch (e) {
      setState("error");
      setMsg(e.message);
    }
  };

  return (
    <div className="card space-y-3 p-4">
      <div>
        <p className="font-semibold text-ink">Enviar aviso a todos</p>
        <p className="text-sm text-muted">Manda una notificación push a quienes las activaron.</p>
      </div>
      <input
        className="input"
        placeholder="Título (ej. ¡Empieza la final!)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="input min-h-[70px]"
        placeholder="Mensaje (opcional)"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <button onClick={send} disabled={state === "loading" || !title.trim()} className="btn-primary w-full">
        {state === "loading" ? "Enviando…" : "Enviar aviso"}
      </button>
      {msg && <p className={`text-sm ${state === "error" ? "text-coral" : "text-court"}`}>{msg}</p>}
    </div>
  );
}
