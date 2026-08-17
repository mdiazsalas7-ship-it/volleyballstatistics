"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getTeams, watchMatches } from "@/lib/data";
import { computeStandings } from "@/lib/standings";
import { PageHeader, Spinner, Empty, LiveBadge } from "@/components/ui";

export default function StandingsPage() {
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTeams().then(setTeams);
    const unsub = watchMatches((m) => {
      setMatches(m);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <Spinner />;

  const rows = computeStandings(teams, matches);
  const live = matches.filter((m) => m.status === "live");

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Torneo amateur" title="Tabla de posiciones" />

      {live.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <LiveBadge />
            <span className="text-sm font-semibold text-ink">Partidos ahora</span>
          </div>
          {live.map((m) => (
            <LiveRow key={m.id} match={m} teams={teams} />
          ))}
        </section>
      )}

      {rows.length === 0 ? (
        <Empty
          title="Todavía no hay equipos"
          hint="El administrador debe cargar los equipos y programar partidos para ver la tabla."
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                <th className="px-3 py-2.5 text-left font-semibold">#</th>
                <th className="px-2 py-2.5 text-left font-semibold">Equipo</th>
                <th className="px-2 py-2.5 text-center font-semibold">PJ</th>
                <th className="px-2 py-2.5 text-center font-semibold">G</th>
                <th className="px-2 py-2.5 text-center font-semibold">P</th>
                <th className="px-2 py-2.5 text-center font-semibold" title="Sets a favor-en contra">Sets</th>
                <th className="px-3 py-2.5 text-center font-semibold">Pts</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.teamId} className="border-b border-line/70 last:border-0">
                  <td className="px-3 py-3 text-muted">{i + 1}</td>
                  <td className="px-2 py-3">
                    <span className="flex items-center gap-2 font-semibold text-ink">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} />
                      {r.name}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-center tabular-nums">{r.played}</td>
                  <td className="px-2 py-3 text-center tabular-nums">{r.won}</td>
                  <td className="px-2 py-3 text-center tabular-nums text-muted">{r.lost}</td>
                  <td className="px-2 py-3 text-center tabular-nums text-muted">
                    {r.setsFor}-{r.setsAgainst}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="led text-base text-court">{r.tablePoints}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="px-1 text-xs text-muted">
        Puntos: 3 por victoria (3-0 / 3-1), 2-1 si va al set decisivo. Desempate por sets y puntos.
      </p>
    </div>
  );
}

function LiveRow({ match, teams }) {
  const home = teams.find((t) => t.id === match.homeTeamId);
  const away = teams.find((t) => t.id === match.awayTeamId);
  const sets = match.sets || [];
  let hs = 0, as = 0;
  for (const s of sets) {
    if ((s.home || 0) > (s.away || 0)) hs++;
    else if ((s.away || 0) > (s.home || 0)) as++;
  }
  const cur = sets[sets.length - 1] || { home: 0, away: 0 };

  return (
    <Link href={`/partido/${match.id}`} className="scoreboard block px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{home?.name || "Local"}</p>
          <p className="truncate text-sm font-semibold text-white/80">{away?.name || "Visita"}</p>
        </div>
        <div className="flex items-center gap-4 pl-4">
          <div className="text-right text-[11px] uppercase tracking-wide text-white/50">
            <p>Sets</p>
            <p className="led text-lg leading-tight">{hs}</p>
            <p className="led text-lg leading-tight">{as}</p>
          </div>
          <div className="rounded-lg bg-white/5 px-3 py-1 text-center">
            <p className="text-[11px] uppercase tracking-wide text-white/50">Set {sets.length || 1}</p>
            <p className="led text-2xl leading-tight">{cur.home || 0}</p>
            <p className="led text-2xl leading-tight">{cur.away || 0}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}
