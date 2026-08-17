"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getTeams, getPlayers, createTeam, updateTeam } from "@/lib/data";
import { uploadImage } from "@/lib/storage";
import { useAuth } from "@/context/AuthContext";
import { Spinner, Empty } from "@/components/ui";
import { TeamLogo } from "@/components/media";
import PhotoInput from "@/components/PhotoInput";

export default function TeamsPage() {
  const { isAdmin } = useAuth();
  const [teams, setTeams] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    const [t, p] = await Promise.all([getTeams(), getPlayers()]);
    const c = {};
    for (const pl of p) c[pl.teamId] = (c[pl.teamId] || 0) + 1;
    setTeams(t); setCounts(c); setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="h-display text-3xl">Equipos</h1>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
            <span className="mi" style={{ fontSize: 20 }}>{showForm ? "close" : "add"}</span>
            {showForm ? "Cerrar" : "Equipo"}
          </button>
        )}
      </div>

      {isAdmin && showForm && <TeamForm onDone={() => { setShowForm(false); load(); }} />}

      {teams.length === 0 ? (
        <Empty title="Todavía no hay equipos" hint={isAdmin ? "Creá el primero con + Equipo." : "El administrador aún no cargó los equipos."} />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {teams.map((t) => (
            <Link key={t.id} href={`/equipos/${t.id}`} className="card flex flex-col items-center gap-3 p-5 text-center transition hover:-translate-y-0.5">
              <TeamLogo team={t} size={72} />
              <div>
                <p className="font-bold text-ink">{t.name}</p>
                <p className="text-xs text-muted">{counts[t.id] || 0} jugadores</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function TeamForm({ onDone, existing }) {
  const [name, setName] = useState(existing?.name || "");
  const [color, setColor] = useState(existing?.color || "#1B4FD1");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (!name.trim()) return setError("Poné un nombre.");
    setSaving(true);
    try {
      let id = existing?.id;
      if (id) await updateTeam(id, { name: name.trim(), color });
      else { const ref = await createTeam({ name: name.trim(), color }); id = ref.id; }
      if (file) {
        const { url, path } = await uploadImage(file, `teams/${id}/logo.jpg`);
        await updateTeam(id, { logoUrl: url, logoPath: path });
      }
      onDone();
    } catch (e) {
      setError(e.message || "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card space-y-3 p-4">
      <PhotoInput current={existing?.logoUrl} onSelect={setFile} label="Logo" />
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-muted">Nombre</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tiburones" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-muted">Color</span>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-16 rounded-lg border border-line" />
      </label>
      {error && <p className="text-sm text-coral">{error}</p>}
      <div className="flex gap-2">
        <button className="btn-primary" disabled={saving} onClick={submit}>{saving ? "Guardando…" : "Guardar"}</button>
        <button className="btn-ghost" onClick={onDone}>Cancelar</button>
      </div>
    </div>
  );
}
