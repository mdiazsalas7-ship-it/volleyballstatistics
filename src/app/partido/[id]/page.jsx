"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { watchMatch, watchMatchStats, getTeams } from "@/lib/data";
import { totalPoints, hittingPct, fmtPct } from "@/lib/stats";
import { Spinner, LiveBadge } from "@/components/ui";
import { TeamLogo, PlayerAvatar } from "@/components/media";

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
    <div className="-mt-5 space-y-5">
      {/* Marcador tipo transmisión */}
      <div className="scoreboard -mx-4 rounded-b-3xl rounded-t-none px-4 pb-5 pt-4">
        <button onClick={() => router.back()} className="mb-2 flex items-center gap-1 text-sm text-white/70">
          <span className="mi" style={{ fontSize: 20 }}>arrow_back</span> Volver
        </button>

        <div className="mb-3 flex justify-center">
          {match.status === "live" ? <LiveBadge /> : (
            <span className="pill bg-white/10 text-white/80">{match.status === "finished" ? "Finalizado" : "Programado"}</span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <TeamCol team={home} fallback="Local" />
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-3">
              <span className="led text-6xl leading-none">{hs}</span>
              <span className="text-3xl font-bold text-white/25">-</span>
              <span className="led text-6xl leading-none">{as}</span>
            </div>
            <span className="mt-1 text-xs font-semibold uppercase tracking-widest text-white/50">Sets</span>
          </div>
          <TeamCol team={away} fallback="Visita" />
        </div>

        {sets.length > 0 && (
          <div className="mt-4 flex justify-center gap-2 overflow-x-auto">
            {sets.map((s, i) => {
              const active = match.status === "live" && i === sets.length - 1;
              return (
                <div key={i} className={`rounded-lg px-3 py-1.5 text-center ${active ? "border border-amber bg-amber/10" : "bg-white/5"}`}>
                  <p className={`text-[10px] uppercase ${active ? "text-amber" : "text-white/40"}`}>S{i + 1}</p>
                  <p className={`led text-sm leading-tight ${active ? "text-amber" : "text-white"}`}>{s.home || 0}-{s.away || 0}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <StatTable title={home?.name || "Local"} color={home?.color || "#1B4FD1"} rows={homeStats} />
      <StatTable title={away?.name || "Visita"} color={away?.color || "#FF5A5F"} rows={awayStats} />
    </div>
  );
}

function TeamCol({ team, fallback }) {
  return (
    <div className="flex w-24 flex-col items-center gap-2 text-center">
      <div className="rounded-full bg-white p-1"><TeamLogo team={team} size={64} /></div>
      <span className="truncate text-sm font-bold text-white">{team?.name || fallback}</span>
    </div>
  );
}

function StatTable({ title, color, rows }) {
  if (!rows.length) return null;
  const sorted = [...rows].sort((a, b) => totalPoints(b) - totalPoints(a));
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        <span className="h-display text-lg">Estadísticas {title}</span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-y border-line text-[11px] uppercase tracking-wide text-muted">
            <th className="px-4 py-2 text-left font-bold">Jugador</th>
            <th className="px-2 py-2 text-center font-bold">Pts</th>
            <th className="px-2 py-2 text-center font-bold">Ataque</th>
            <th className="px-2 py-2 text-center font-bold">Aces</th>
            <th className="px-4 py-2 text-center font-bold">Bloq</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((s, i) => (
            <tr key={s.playerId} className={i % 2 ? "bg-surface/60" : ""}>
              <td className="px-4 py-2.5">
                <span className="flex items-center gap-2.5">
                  <PlayerAvatar player={s} size={32} />
                  <span className="font-semibold text-snow">
                    {s.number != null ? <span className="text-muted">#{s.number} </span> : ""}{s.playerName}
                  </span>
                </span>
              </td>
              <td className="px-2 py-2.5 text-center"><span className="led text-court">{totalPoints(s)}</span></td>
              <td className="px-2 py-2.5 text-center tabular-nums">{s.kills || 0}</td>
              <td className="px-2 py-2.5 text-center tabular-nums">{s.aces || 0}</td>
              <td className="px-4 py-2.5 text-center tabular-nums">{(s.blockSolo || 0) + (s.blockAssist || 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
