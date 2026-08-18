"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getTeams, watchMatches } from "@/lib/data";
import { computeStandings } from "@/lib/standings";
import { Spinner, Empty, LiveBadge } from "@/components/ui";
import { TeamLogo } from "@/components/media";

export default function StandingsPage() {
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTeams().then(setTeams);
    const unsub = watchMatches((m) => { setMatches(m); setLoading(false); });
    return () => unsub();
  }, []);

  if (loading) return <Spinner />;

  const rows = computeStandings(teams, matches);
  const live = matches.filter((m) => m.status === "live");
  const teamById = (id) => teams.find((t) => t.id === id);

  return (
    <div className="space-y-6">
      {live.map((m) => (
        <LiveScoreboard key={m.id} match={m} teamById={teamById} />
      ))}

      <div>
        <h1 className="h-display mb-3 text-3xl">Tabla de Posiciones</h1>
        {rows.length === 0 ? (
          <Empty title="Todavía no hay equipos" hint="El administrador debe cargar los equipos y programar partidos." />
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-court/[0.06] text-[11px] uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 text-left font-bold">Pos</th>
                  <th className="py-3 text-left font-bold">Equipo</th>
                  <th className="px-2 py-3 text-center font-bold">PJ</th>
                  <th className="px-2 py-3 text-center font-bold">G</th>
                  <th className="px-2 py-3 text-center font-bold">Sets</th>
                  <th className="px-4 py-3 text-center font-bold">Pts</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.teamId} className={`border-t border-line/70 ${i === 0 ? "bg-court/[0.06]" : ""}`}>
                    <td className={`px-4 py-3.5 font-bold ${i === 0 ? "text-court" : "text-muted"}`}>{i + 1}</td>
                    <td className="py-3.5">
                      <span className="flex items-center gap-2.5">
                        <TeamLogo team={teamById(r.teamId) || r} size={30} />
                        <span className="font-semibold text-snow">{r.name}</span>
                      </span>
                    </td>
                    <td className="px-2 py-3.5 text-center tabular-nums">{r.played}</td>
                    <td className="px-2 py-3.5 text-center tabular-nums">{r.won}</td>
                    <td className="px-2 py-3.5 text-center tabular-nums text-muted">{r.setsFor}-{r.setsAgainst}</td>
                    <td className="px-4 py-3.5 text-center"><span className="led text-lg text-court">{r.tablePoints}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 px-1 text-xs text-muted">
          3 pts por victoria (3-0 / 3-1), 2-1 si va al set decisivo. Desempate por sets y puntos.
        </p>
      </div>
    </div>
  );
}

function LiveScoreboard({ match, teamById }) {
  const home = teamById(match.homeTeamId);
  const away = teamById(match.awayTeamId);
  const sets = match.sets || [];
  let hs = 0, as = 0;
  for (const s of sets) {
    if ((s.home || 0) > (s.away || 0)) hs++;
    else if ((s.away || 0) > (s.home || 0)) as++;
  }
  const cur = sets[sets.length - 1] || { home: 0, away: 0 };

  return (
    <Link href={`/partido/${match.id}`} className="scoreboard block p-5">
      <div className="mb-3"><LiveBadge /></div>
      <div className="flex items-center justify-between gap-3">
        <TeamCol team={home} fallback="Local" />
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <span className="led text-5xl leading-none">{cur.home || 0}</span>
            <span className="text-3xl font-bold text-white/30">-</span>
            <span className="led text-5xl leading-none">{cur.away || 0}</span>
          </div>
          <span className="mt-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
            Sets: {hs} - {as}
          </span>
        </div>
        <TeamCol team={away} fallback="Visita" />
      </div>
    </Link>
  );
}

function TeamCol({ team, fallback }) {
  return (
    <div className="flex w-20 flex-col items-center gap-2 text-center">
      <div className="rounded-full bg-white p-0.5">
        <TeamLogo team={team} size={56} />
      </div>
      <span className="truncate text-xs font-bold uppercase text-white">{team?.name || fallback}</span>
    </div>
  );
}
