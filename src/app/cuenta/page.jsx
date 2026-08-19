"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useBranding } from "@/context/BrandingContext";
import { PageHeader, Spinner } from "@/components/ui";
import InstallPWA from "@/components/InstallPWA";
import NotificationToggle from "@/components/NotificationToggle";
import { sendBroadcast } from "@/lib/messaging";
import { updateBranding } from "@/lib/data";
import { uploadImage } from "@/lib/storage";

export default function AccountPage() {
  const { user, isAdmin, logout, loading } = useAuth();
  const router = useRouter();

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Perfil" title="Mi cuenta" />

      <InstallPWA />
      <NotificationToggle />

      {user ? (
        <>
          <div className="card space-y-2 p-4">
            <Row label="Correo" value={user.email} />
            <Row label="Rol" value={isAdmin ? "Administrador" : "Visitante"} />
          </div>

          {isAdmin && (
            <>
              <BrandingForm />
              <Link href="/noticias" className="card flex items-center justify-between p-4">
                <span className="flex items-center gap-3">
                  <span className="mi text-court" style={{ fontSize: 24 }}>newspaper</span>
                  <span className="font-semibold text-snow">Gestionar noticias</span>
                </span>
                <span className="mi text-muted" style={{ fontSize: 22 }}>chevron_right</span>
              </Link>
              <BroadcastForm user={user} />
            </>
          )}

          <button onClick={async () => { await logout(); router.push("/"); }} className="btn-ghost w-full border-coral/40 text-coral">
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
      <span className="text-sm font-semibold text-snow">{value}</span>
    </div>
  );
}

function BrandingForm() {
  const branding = useBranding();
  const [name, setName] = useState(branding.leagueName || "");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(branding.logoUrl || "/logo.png");
  const [state, setState] = useState("idle");
  const [msg, setMsg] = useState("");

  const pick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const save = async () => {
    setState("loading"); setMsg("");
    try {
      const data = { leagueName: name.trim() || "Torneo Voley" };
      if (file) {
        const { url, path } = await uploadImage(file, `branding/logo.jpg`);
        data.logoUrl = url; data.logoPath = path;
      }
      await updateBranding(data);
      setState("done"); setMsg("Marca actualizada. Ya se ve en toda la app.");
    } catch (e) {
      setState("error"); setMsg(e.message || "No se pudo guardar.");
    }
  };

  return (
    <div className="card space-y-3 p-4">
      <div>
        <p className="font-semibold text-snow">Marca de la liga</p>
        <p className="text-sm text-muted">Cambiá el nombre y el logo que se ven arriba en toda la app.</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-line bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview || "/logo.png"} alt="" className="h-full w-full object-cover" />
        </div>
        <label className="btn-ghost cursor-pointer">
          Logo
          <input type="file" accept="image/*" className="hidden" onChange={pick} />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-muted">Nombre de la liga / torneo</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Liga Metropolitana de Voley" />
      </label>
      {msg && <p className={`text-sm ${state === "error" ? "text-coral" : "text-court"}`}>{msg}</p>}
      <button className="btn-primary" disabled={state === "loading"} onClick={save}>
        {state === "loading" ? "Guardando…" : "Guardar marca"}
      </button>
    </div>
  );
}

function BroadcastForm({ user }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [state, setState] = useState("idle");
  const [msg, setMsg] = useState("");

  const send = async () => {
    setState("loading"); setMsg("");
    try {
      const res = await sendBroadcast(user, title, body);
      setState("done"); setMsg(`Aviso enviado a ${res.sent} dispositivo(s).`);
      setTitle(""); setBody("");
    } catch (e) {
      setState("error"); setMsg(e.message);
    }
  };

  return (
    <div className="card space-y-3 p-4">
      <div>
        <p className="font-semibold text-snow">Enviar aviso a todos</p>
        <p className="text-sm text-muted">Notificación push a quienes las activaron.</p>
      </div>
      <input className="input" placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className="input min-h-[70px]" placeholder="Mensaje (opcional)" value={body} onChange={(e) => setBody(e.target.value)} />
      <button onClick={send} disabled={state === "loading" || !title.trim()} className="btn-primary w-full">
        {state === "loading" ? "Enviando…" : "Enviar aviso"}
      </button>
      {msg && <p className={`text-sm ${state === "error" ? "text-coral" : "text-court"}`}>{msg}</p>}
    </div>
  );
}
