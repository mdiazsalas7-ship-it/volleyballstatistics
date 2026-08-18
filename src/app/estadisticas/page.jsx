"use client";

import { useEffect, useMemo, useState } from "react";
import { getAllPlayerStats, getTeams } from "@/lib/data";
import { addStats, emptyStats, totalPoints, hittingPct, fmtPct } from "@/lib/stats";
import { Spinner, Empty } from "@/components/ui";
import { PlayerAvatar } from "@/components/media";

const CATEGORIES = [
  { key: "points", label: "Puntos", title: "Máximos Anotadores", unit: "PTS", get: (s) => totalPoints(s), fmt: (v) => v },
  { key: "kills", label: "Kills", title: "Líderes en Kills", unit: "K", get: (s) => s.kills || 0, fmt: (v) => v },
  { key: "aces", label: "Aces", title: "Líderes en Aces", unit: "SA", get: (s) => s.aces || 0, fmt: (v) => v },
  { key: "blocks", label: "Bloqueos", title: "Líderes en Bloqueos", unit: "BLK", get: (s) => (s.blockSolo || 0) + (s.blockAssist || 0), fmt: (v) => v },
  { key: "digs", label: "Defensas", title: "Líderes en Defensas", unit: "D", get: (s) => s.digs || 0, fmt: (v) => v },
  { key: "assists", label: "Asistencias", title: "Líderes en Asistencias", unit: "A", get: (s) => s.assists || 0, fmt: (v) => v },
  { key: "hitting", label: "Eficiencia", title: "Eficiencia de Ataque", unit: "EF", get: (s) => hittingPct(s), fmt: (v) => fmtPct(v), min: (s) => (s.attackAttempts || 0) >= 5 },
];

const MEDAL = ["#FFC043", "#C0C7D1", "#B0713A"];

export default function StatsPage() {
  const [stats, setStats] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState(CATEGORIES[0]);

  useEffect(() => {
    Promise.all([getAllPlayerStats().catch(() => []), getTeams().catch(() => [])])
      .then(([s, t]) => { setStats(s); setTeams(t); })
      .finally(() => setLoading(false));
  }, []);

  const teamName = (id) => teams.find((t) => t.id === id)?.name || "";

  const players = useMemo(() => {
    const map = {};
    for (const row of stats) {
      const id = row.playerId;
      if (!map[id]) map[id] = { playerId: id, playerName: row.playerName || "Jugador", number: row.number, teamId: row.teamId, photoUrl: row.photoUrl, ...emptyStats() };
      map[id] = { ...map[id], ...addStats(map[id], row) };
      map[id].playerName = row.playerName || map[id].playerName;
      map[id].teamId = row.teamId || map[id].teamId;
    }
    return Object.values(map);
  }, [stats]);

  if (loading) return <Spinner />;

  const filtered = players.filter((p) => (cat.min ? cat.min(p) : true));
  const ranked = [...filtered].sort((a, b) => cat.get(b) - cat.get(a)).slice(0, 25);

  return (
    <div className="space-y-4">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {CATEGORIES.map((c) => (
          <button key={c.key} onClick={() => setCat(c)} className={`chip ${cat.key === c.key ? "chip-active" : ""}`}>
            {c.label}
          </button>
        ))}
      </div>

      <h1 className="h-display text-2xl">{cat.title}</h1>

      {ranked.length === 0 ? (
        <Empty title="Sin datos todavía" hint="Las estadísticas aparecen cuando la mesa técnica registra acciones." />
      ) : (
        <div className="space-y-2.5">
          {ranked.map((p, i) => (
            <div key={p.playerId} className="card flex items-center gap-3 p-3">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                style={i < 3 ? { background: MEDAL[i], color: "#0E1726" } : { background: "#EEF1F8", color: "#5B6675" }}
              >
                {i + 1}
              </span>
              <PlayerAvatar player={p} size={44} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-ink">{p.playerName}</p>
                <p className="truncate text-xs text-muted">{teamName(p.teamId)}</p>
              </div>
              <div className="text-right">
                <p className="led text-2xl leading-none">{cat.fmt(cat.get(p))}</p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted">{cat.unit}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {cat.key === "hitting" && <p className="px-1 text-xs text-muted">Eficiencia = (kills − errores) / intentos. Mínimo 5 intentos.</p>}
    </div>
  );
}
