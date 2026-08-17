"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { watchMatch, watchMatchStats, getTeams } from "@/lib/data";
import { totalPoints, hittingPct, fmtPct } from "@/lib/stats";
import { Spinner, LiveBadge } from "@/components/ui";

export default function MatchPage() {
  const { id } = useParams();
  const router = useRouter();
  const [match, setMatch] = useState(undefined);
  const [teams, setTeams] = useState([]);
  const [stats, setStats] = useState([]);

  useEffect(() => {
    getTeams().then(setTeams);
    const u1 = watchMatch(id, setMatch);
    const u2 = watchMatchStats(id, setStats);
    return () => { u1(); u2(); };
  }, [id]);

  if (match === undefined) return <Spinner />;
  if (match === null) return <p className="card px-6 py-12 text-center">Partido no encontrado.</p>;

  const home = teams.find((t) => t.id === match.homeTeamId);
  const away = teams.find((t) => t.id === match.awayTeamId);
  const sets = match.sets || [];
  let hs = 0, as = 0;
  for (const s of sets) {
    if ((s.home || 0) > (s.away || 0)) hs++;
    else if ((s.away || 0) > (s.home || 0)) as++;
  }

  const homeStats = stats.filter((s) => s.teamId === match.homeTeamId);
  const awayStats = stats.filter((s) => s.teamId === match.awayTeamId);

  return (
    <div className="space-y-5">
      <button onClick={() => router.back()} className="btn-ghost">← Volver</button>

      <div className="scoreboard p-4">
        <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-wide text-white/50">
          <span>{match.status === "live" ? <LiveBadge /> : match.status === "finished" ? "Finalizado" : "Programado"}</span>
          {match.court ? <span>{match.court}</span> : null}
        </div>
        <TeamScore name={home?.name || "Local"} sets={hs} />
        <div className="my-2 h-px bg-white/10" />
        <TeamScore name={away?.name || "Visita"} sets={as} />

        {sets.length > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto">
            {sets.map((s, i) => (
              <div key={i} className="rounded-lg bg-white/5 px-3 py-1.5 text-center">
                <p className="text-[10px] uppercase text-white/40">Set {i + 1}</p>
                <p className="led text-sm leading-tight">{s.home || 0}</p>
                <p className="led text-sm leading-tight">{s.away || 0}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <StatTable title={home?.name || "Local"} rows={homeStats} />
      <StatTable title={away?.name || "Visita"} rows={awayStats} />
    </div>
  );
}

function TeamScore({ name, sets }) {
  return (
    <div className="flex items-center justify-between">
      <span className="min-w-0 flex-1 truncate text-lg font-semibold text-white">{name}</span>
      <span className="led text-4xl">{sets}</span>
    </div>
  );
}

function StatTable({ title, rows }) {
  if (!rows.length) return null;
  const sorted = [...rows].sort((a, b) => totalPoints(b) - totalPoints(a));
  return (
    <div className="card overflow-hidden">
      <div className="border-b border-line px-4 py-2.5 text-sm font-semibold text-ink">{title}</div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-muted">
            <th className="px-3 py-2 text-left font-semibold">Jugador</th>
            <th className="px-2 py-2 text-center font-semibold" title="Puntos">Pts</th>
            <th className="px-2 py-2 text-center font-semibold" title="Kills">K</th>
            <th className="px-2 py-2 text-center font-semibold" title="Aces">SA</th>
            <th className="px-2 py-2 text-center font-semibold" title="Bloqueos">Blk</th>
            <th className="px-3 py-2 text-center font-semibold" title="Eficiencia de ataque">Ef%</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((s) => (
            <tr key={s.playerId} className="border-t border-line/60">
              <td className="px-3 py-2 font-medium text-ink">
                {s.number != null ? `#${s.number} ` : ""}{s.playerName}
              </td>
              <td className="px-2 py-2 text-center tabular-nums font-semibold">{totalPoints(s)}</td>
              <td className="px-2 py-2 text-center tabular-nums">{s.kills || 0}</td>
              <td className="px-2 py-2 text-center tabular-nums">{s.aces || 0}</td>
              <td className="px-2 py-2 text-center tabular-nums">{(s.blockSolo || 0) + (s.blockAssist || 0)}</td>
              <td className="px-3 py-2 text-center tabular-nums text-muted">{fmtPct(hittingPct(s))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
