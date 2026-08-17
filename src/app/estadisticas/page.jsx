"use client";

import { useEffect, useMemo, useState } from "react";
import { getAllPlayerStats, getTeams } from "@/lib/data";
import { addStats, emptyStats, totalPoints, hittingPct, fmtPct } from "@/lib/stats";
import { PageHeader, Spinner, Empty } from "@/components/ui";

const CATEGORIES = [
  { key: "points", label: "Puntos", get: (s) => totalPoints(s), fmt: (v) => v },
  { key: "kills", label: "Kills", get: (s) => s.kills || 0, fmt: (v) => v },
  { key: "aces", label: "Aces", get: (s) => s.aces || 0, fmt: (v) => v },
  { key: "blocks", label: "Bloqueos", get: (s) => (s.blockSolo || 0) + (s.blockAssist || 0), fmt: (v) => v },
  { key: "digs", label: "Defensas", get: (s) => s.digs || 0, fmt: (v) => v },
  { key: "assists", label: "Asistencias", get: (s) => s.assists || 0, fmt: (v) => v },
  { key: "hitting", label: "Efic. ataque", get: (s) => hittingPct(s), fmt: (v) => fmtPct(v), min: (s) => (s.attackAttempts || 0) >= 5 },
];

export default function StatsPage() {
  const [stats, setStats] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState(CATEGORIES[0]);

  useEffect(() => {
    Promise.all([getAllPlayerStats(), getTeams()]).then(([s, t]) => {
      setStats(s);
      setTeams(t);
      setLoading(false);
    });
  }, []);

  const teamName = (id) => teams.find((t) => t.id === id)?.name || "";

  // Agrega por jugador sumando todos sus partidos
  const players = useMemo(() => {
    const map = {};
    for (const row of stats) {
      const id = row.playerId;
      if (!map[id]) {
        map[id] = {
          playerId: id,
          playerName: row.playerName || "Jugador",
          number: row.number,
          teamId: row.teamId,
          ...emptyStats(),
        };
      }
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
    <div className="space-y-5">
      <PageHeader eyebrow="Rendimiento" title="Estadísticas individuales" />

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCat(c)}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
              cat.key === c.key ? "bg-ink text-white" : "border border-line bg-card text-muted"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {ranked.length === 0 ? (
        <Empty
          title="Sin datos todavía"
          hint="Las estadísticas aparecen cuando la mesa técnica registra acciones en los partidos."
        />
      ) : (
        <div className="card divide-y divide-line/70">
          {ranked.map((p, i) => (
            <div key={p.playerId} className="flex items-center gap-3 px-4 py-3">
              <span className={`w-6 text-center text-sm font-bold ${i < 3 ? "text-amber" : "text-muted"}`}>
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">
                  {p.number != null ? `#${p.number} ` : ""}{p.playerName}
                </p>
                <p className="truncate text-xs text-muted">{teamName(p.teamId)}</p>
              </div>
              <span className="led text-xl text-court">{cat.fmt(cat.get(p))}</span>
            </div>
          ))}
        </div>
      )}
      {cat.key === "hitting" && (
        <p className="px-1 text-xs text-muted">Eficiencia = (kills − errores) / intentos. Mínimo 5 intentos.</p>
      )}
    </div>
  );
}
