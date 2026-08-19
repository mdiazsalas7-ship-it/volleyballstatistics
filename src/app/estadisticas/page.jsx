"use client";

import { useEffect, useMemo, useState } from "react";
import { getAllPlayerStats, getTeams } from "@/lib/data";
import { addStats, emptyStats, totalPoints, hittingPct, fmtPct } from "@/lib/stats";
import { Spinner, Empty } from "@/components/ui";
import { PlayerAvatar } from "@/components/media";

const CATEGORIES = [
  { key: "points", label: "Puntos", title: "Máximos Anotadores", unit: "PTS", get: (s) => totalPoints(s) },
  { key: "kills", label: "Kills", title: "Líderes en Kills", unit: "K", get: (s) => s.kills || 0 },
  { key: "aces", label: "Aces", title: "Líderes en Aces", unit: "SA", get: (s) => s.aces || 0 },
  { key: "blocks", label: "Bloqueos", title: "Líderes en Bloqueos", unit: "BLK", get: (s) => (s.blockSolo || 0) + (s.blockAssist || 0) },
  { key: "digs", label: "Defensas", title: "Líderes en Defensas", unit: "D", get: (s) => s.digs || 0 },
  { key: "assists", label: "Asistencias", title: "Líderes en Asistencias", unit: "A", get: (s) => s.assists || 0 },
  { key: "hitting", label: "Eficiencia", title: "Eficiencia de Ataque", unit: "EF", rate: true, get: (s) => hittingPct(s), fmt: (v) => fmtPct(v), min: (s) => (s.attackAttempts || 0) >= 5 },
];

const MEDAL = ["#FFC043", "#C0C7D1", "#B0713A"];

export default function StatsPage() {
  const [stats, setStats] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState(CATEGORIES[0]);
  const [mode, setMode] = useState("total"); // total | avg

  useEffect(() => {
    Promise.all([getAllPlayerStats().catch(() => []), getTeams().catch(() => [])])
      .then(([s, t]) => { setStats(s); setTeams(t); })
      .finally(() => setLoading(false));
  }, []);

  const teamName = (id) => teams.find((t) => t.id === id)?.name || "";

  // Agrega por jugador y cuenta partidos jugados (gp)
  const players = useMemo(() => {
    const map = {};
    for (const row of stats) {
      const id = row.playerId;
      if (!map[id]) map[id] = { playerId: id, playerName: row.playerName || "Jugador", number: row.number, teamId: row.teamId, photoUrl: row.photoUrl, gp: 0, ...emptyStats() };
      map[id] = { ...map[id], ...addStats(map[id], row), gp: map[id].gp + 1 };
      map[id].playerName = row.playerName || map[id].playerName;
      map[id].teamId = row.teamId || map[id].teamId;
      map[id].photoUrl = row.photoUrl || map[id].photoUrl;
    }
    return Object.values(map);
  }, [stats]);

  if (loading) return <Spinner />;

  // Valor según modo (total o por partido). Las tasas (eficiencia) no se dividen.
  const valueOf = (p) => {
    const raw = cat.get(p);
    if (mode === "total" || cat.rate) return raw;
    return p.gp > 0 ? raw / p.gp : 0;
  };
  const fmtVal = (p) => {
    const v = valueOf(p);
    if (cat.fmt) return cat.fmt(v);
    if (mode === "avg" && !cat.rate) return v.toFixed(1);
    return v;
  };
  const unit = cat.rate ? cat.unit : mode === "avg" ? cat.unit + "/PJ" : cat.unit;

  const filtered = players.filter((p) => (cat.min ? cat.min(p) : true) && (mode === "total" || p.gp > 0));
  const ranked = [...filtered].sort((a, b) => valueOf(b) - valueOf(a)).slice(0, 25);

  return (
    <div className="space-y-4">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {CATEGORIES.map((c) => (
          <button key={c.key} onClick={() => setCat(c)} className={`chip ${cat.key === c.key ? "chip-active" : ""}`}>{c.label}</button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h1 className="h-display text-2xl">{cat.title}</h1>
        {!cat.rate && (
          <div className="flex rounded-full border border-line p-0.5 text-xs font-bold">
            <button onClick={() => setMode("total")} className={`rounded-full px-3 py-1 ${mode === "total" ? "bg-court text-white" : "text-muted"}`}>Totales</button>
            <button onClick={() => setMode("avg")} className={`rounded-full px-3 py-1 ${mode === "avg" ? "bg-court text-white" : "text-muted"}`}>Por partido</button>
          </div>
        )}
      </div>

      {ranked.length === 0 ? (
        <Empty title="Sin datos todavía" hint="Las estadísticas aparecen cuando la mesa técnica registra acciones." />
      ) : (
        <div className="space-y-2.5">
          {ranked.map((p, i) => (
            <div key={p.playerId} className="card flex items-center gap-3 p-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={i < 3 ? { background: MEDAL[i], color: "#0E1726" } : { background: "#1E2C49", color: "#8FA6C9" }}>{i + 1}</span>
              <PlayerAvatar player={p} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-snow">{p.playerName}</p>
                <p className="truncate text-xs text-muted">{teamName(p.teamId)}{mode === "avg" && !cat.rate ? ` · ${p.gp} PJ` : ""}</p>
              </div>
              <div className="text-right">
                <p className="led text-2xl leading-none">{fmtVal(p)}</p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{unit}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {cat.key === "hitting" && <p className="px-1 text-xs text-muted">Eficiencia = (kills − errores) / intentos. Mínimo 5 intentos.</p>}
    </div>
  );
}
