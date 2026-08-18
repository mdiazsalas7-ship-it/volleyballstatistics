"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTeam, getPlayersByTeam, createPlayer, updatePlayer, deletePlayer, deleteTeam } from "@/lib/data";
import { uploadImage } from "@/lib/storage";
import { ROLES, roleLabel } from "@/lib/roles";
import { useAuth } from "@/context/AuthContext";
import { Spinner, Empty } from "@/components/ui";
import { TeamLogo, PlayerAvatar } from "@/components/media";
import PhotoInput from "@/components/PhotoInput";
import { TeamForm } from "../page";

export default function TeamDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAdmin } = useAuth();

  const [team, setTeam] = useState(undefined);
  const [players, setPlayers] = useState([]);
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editTeam, setEditTeam] = useState(false);

  const load = async () => {
    const [t, p] = await Promise.all([getTeam(id), getPlayersByTeam(id)]);
    setTeam(t);
    setPlayers(p.sort((a, b) => (a.number || 0) - (b.number || 0)));
  };

  useEffect(() => { load(); }, [id]);

  if (team === undefined) return <Spinner />;
  if (team === null) return <p className="card px-6 py-12 text-center">Equipo no encontrado.</p>;

  const removeTeam = async () => {
    if (!confirm(`¿Eliminar "${team.name}" y todos sus jugadores? No se puede deshacer.`)) return;
    await deleteTeam(id);
    router.push("/equipos");
  };

  return (
    <div className="-mt-5 space-y-5">
      {/* Encabezado del equipo tipo panel oscuro */}
      <div className="scoreboard -mx-4 rounded-b-3xl rounded-t-none px-4 pb-6 pt-4">
        <button onClick={() => router.push("/equipos")} className="mb-2 flex items-center gap-1 text-sm text-white/70">
          <span className="mi" style={{ fontSize: 20 }}>arrow_back</span> Equipos
        </button>
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="rounded-full bg-white p-1"><TeamLogo team={team} size={84} /></div>
          <h1 className="h-display text-3xl text-amber">{team.name}</h1>
          <span className="pill bg-white/10 text-white">
            <span className="mi" style={{ fontSize: 16 }}>group</span> {players.length} Jugadores
          </span>
        </div>
      </div>

      {isAdmin && (
        <div className="flex gap-2">
          <button onClick={() => setEditTeam((v) => !v)} className="btn-ghost flex-1">Editar equipo</button>
          <button onClick={removeTeam} className="btn-ghost flex-1 border-coral/40 text-coral">Eliminar</button>
        </div>
      )}
      {isAdmin && editTeam && <TeamForm existing={team} onDone={() => { setEditTeam(false); load(); }} />}

      <div className="flex items-center justify-between">
        <h2 className="h-display text-xl">Roster Oficial</h2>
        {isAdmin && (
          <button className="btn-primary" onClick={() => { setEditing(null); setShowPlayerForm((v) => !v); }}>
            <span className="mi" style={{ fontSize: 20 }}>add</span> Jugador
          </button>
        )}
      </div>

      {isAdmin && showPlayerForm && (
        <PlayerForm teamId={id} existing={editing} onDone={() => { setShowPlayerForm(false); setEditing(null); load(); }} />
      )}

      {players.length === 0 ? (
        <Empty title="Sin jugadores" hint={isAdmin ? "Agregá el primero con + Jugador." : "Todavía no hay roster cargado."} />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {players.map((p) => (
            <div key={p.id} className="card overflow-hidden">
              <div className="relative aspect-square bg-surface">
                {p.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photoUrl} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center"><PlayerAvatar player={p} size={72} /></div>
                )}
                {p.number != null && (
                  <span className="absolute left-2 top-2 rounded-lg bg-ink/85 px-2.5 py-1 led text-base">#{p.number}</span>
                )}
              </div>
              <div className="p-3">
                <p className="truncate font-bold text-snow">{p.name}</p>
                <p className="text-xs font-bold uppercase tracking-wide text-court">{roleLabel(p.role)}</p>
                {isAdmin && (
                  <div className="mt-2 flex gap-1">
                    <button onClick={() => { setEditing(p); setShowPlayerForm(true); }} className="flex-1 rounded-lg border border-line py-1 text-xs text-muted">Editar</button>
                    <button onClick={async () => { if (confirm(`¿Eliminar a ${p.name}?`)) { await deletePlayer(p.id); load(); } }} className="rounded-lg border border-line px-2 py-1 text-xs text-coral">✕</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PlayerForm({ teamId, existing, onDone }) {
  const [name, setName] = useState(existing?.name || "");
  const [number, setNumber] = useState(existing?.number ?? "");
  const [role, setRole] = useState(existing?.role || "");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (!name.trim()) return setError("Poné el nombre del jugador.");
    setSaving(true);
    try {
      const data = { name: name.trim(), number: number === "" ? null : Number(number), role: role || null, teamId };
      let id = existing?.id;
      if (id) await updatePlayer(id, data);
      else { const ref = await createPlayer(data); id = ref.id; }
      if (file) {
        const { url, path } = await uploadImage(file, `players/${id}/photo.jpg`);
        await updatePlayer(id, { photoUrl: url, photoPath: path });
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
      <p className="font-semibold text-snow">{existing ? "Editar jugador" : "Nuevo jugador"}</p>
      <PhotoInput current={existing?.photoUrl} onSelect={setFile} label="Foto" round={false} />
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-muted">Nombre</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ana Ríos" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">Dorsal</span>
          <input className="input" type="number" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="7" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">Posición</span>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">—</option>
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </label>
      </div>
      {error && <p className="text-sm text-coral">{error}</p>}
      <div className="flex gap-2">
        <button className="btn-primary" disabled={saving} onClick={submit}>{saving ? "Guardando…" : "Guardar"}</button>
        <button className="btn-ghost" onClick={onDone}>Cancelar</button>
      </div>
    </div>
  );
}
