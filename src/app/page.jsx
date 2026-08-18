"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getTeams, watchMatches, watchNews, getAllPlayerStats } from "@/lib/data";
import { computeStandings } from "@/lib/standings";
import { addStats, emptyStats, totalPoints } from "@/lib/stats";
import { Spinner, LiveBadge } from "@/components/ui";
import { TeamLogo, PlayerAvatar } from "@/components/media";

export default function HomePage() {
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [news, setNews] = useState([]);
  const [rawStats, setRawStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTeams().then(setTeams);
    getAllPlayerStats().then(setRawStats).catch(() => setRawStats([]));
    const u1 = watchMatches((m) => { setMatches(m); setLoading(false); });
    const u2 = watchNews(setNews, 10);
    return () => { u1(); u2(); };
  }, []);

  const teamById = (id) => teams.find((t) => t.id === id);

  const live = matches.filter((m) => m.status === "live");
  const finished = matches.filter((m) => m.status === "finished").slice(-8).reverse();
  const upcoming = matches.filter((m) => m.status === "scheduled").slice(0, 8);
  const standings = computeStandings(teams, matches).slice(0, 4);

  const leaders = useMemo(() => {
    const map = {};
    for (const r of rawStats) {
      const id = r.playerId;
      if (!map[id]) map[id] = { playerId: id, playerName: r.playerName, photoUrl: r.photoUrl, teamId: r.teamId, ...emptyStats() };
      map[id] = { ...map[id], ...addStats(map[id], r) };
      map[id].playerName = r.playerName || map[id].playerName;
      map[id].photoUrl = r.photoUrl || map[id].photoUrl;
    }
    return Object.values(map).sort((a, b) => totalPoints(b) - totalPoints(a)).slice(0, 8);
  }, [rawStats]);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-7 pb-4">
      {live.map((m) => <LiveCard key={m.id} match={m} teamById={teamById} />)}

      {news.length > 0 && (
        <Section title="Noticias" href="/noticias" cta="Ver todas">
          <Carousel>
            {news.map((n) => <NewsCard key={n.id} n={n} />)}
          </Carousel>
        </Section>
      )}

      {finished.length > 0 && (
        <Section title="Últimos resultados" href="/calendario" cta="Ver todos">
          <Carousel>
            {finished.map((m) => <ResultCard key={m.id} match={m} teamById={teamById} />)}
          </Carousel>
        </Section>
      )}

      {leaders.length > 0 && (
        <Section title="Líderes de la liga" href="/estadisticas" cta="Ver todos">
          <Carousel>
            {leaders.map((p, i) => <LeaderCard key={p.playerId} p={p} rank={i + 1} teamById={teamById} />)}
          </Carousel>
        </Section>
      )}

      {upcoming.length > 0 && (
        <Section title="Próximos partidos" href="/calendario" cta="Ver todos">
          <Carousel>
            {upcoming.map((m) => <UpcomingCard key={m.id} match={m} teamById={teamById} />)}
          </Carousel>
        </Section>
      )}

      {standings.length > 0 && (
        <Section title="Tabla de posiciones" href="/tabla" cta="Ver toda">
          <div className="card overflow-hidden">
            {standings.map((r, i) => (
              <Link key={r.teamId} href="/tabla" className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-line/70" : ""}`}>
                <span className={`w-4 text-center text-sm font-bold ${i === 0 ? "text-court" : "text-muted"}`}>{i + 1}</span>
                <TeamLogo team={teamById(r.teamId) || r} size={28} />
                <span className="flex-1 truncate font-semibold text-snow">{r.name}</span>
                <span className="text-xs text-muted">{r.won}G</span>
                <span className="led text-lg text-court">{r.tablePoints}</span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {live.length === 0 && finished.length === 0 && upcoming.length === 0 && news.length === 0 && (
        <div className="card px-6 py-16 text-center">
          <span className="mi mb-2 text-muted" style={{ fontSize: 44 }}>sports_volleyball</span>
          <p className="h-display text-lg">Bienvenido</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            Cuando el administrador cargue equipos, partidos y noticias, tu resumen aparecerá acá.
          </p>
        </div>
      )}
    </div>
  );
}

function Section({ title, href, cta, children }) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between">
        <h2 className="h-display text-xl">{title}</h2>
        {href && <Link href={href} className="text-sm font-semibold text-court">{cta || "Ver todo"}</Link>}
      </div>
      {children}
    </section>
  );
}

function Carousel({ children }) {
  return (
    <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {children}
    </div>
  );
}

function setsWon(sets = []) {
  let h = 0, a = 0;
  for (const s of sets) { if ((s.home || 0) > (s.away || 0)) h++; else if ((s.away || 0) > (s.home || 0)) a++; }
  return { h, a };
}

function LiveCard({ match, teamById }) {
  const home = teamById(match.homeTeamId), away = teamById(match.awayTeamId);
  const sets = match.sets || [];
  const cur = sets[sets.length - 1] || { home: 0, away: 0 };
  const { h, a } = setsWon(sets);
  return (
    <Link href={`/partido/${match.id}`} className="scoreboard block p-5">
      <div className="mb-3"><LiveBadge /></div>
      <div className="flex items-center justify-between gap-3">
        <MiniTeam team={home} fallback="Local" />
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <span className="led text-5xl leading-none">{cur.home || 0}</span>
            <span className="text-3xl font-bold text-white/25">-</span>
            <span className="led text-5xl leading-none">{cur.away || 0}</span>
          </div>
          <span className="mt-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">Sets: {h} - {a}</span>
        </div>
        <MiniTeam team={away} fallback="Visita" />
      </div>
    </Link>
  );
}

function MiniTeam({ team, fallback }) {
  return (
    <div className="flex w-20 flex-col items-center gap-2 text-center">
      <div className="rounded-full bg-white p-0.5"><TeamLogo team={team} size={52} /></div>
      <span className="truncate text-xs font-bold uppercase text-white">{team?.name || fallback}</span>
    </div>
  );
}

function NewsCard({ n }) {
  return (
    <Link href={`/noticias/${n.id}`} className="card w-64 shrink-0 snap-start overflow-hidden">
      <div className="aspect-video bg-surface">
        {n.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={n.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center"><span className="mi text-muted" style={{ fontSize: 40 }}>newspaper</span></div>
        )}
      </div>
      <div className="p-3">
        <p className="line-clamp-2 font-bold leading-snug text-snow">{n.title}</p>
      </div>
    </Link>
  );
}

function ResultCard({ match, teamById }) {
  const home = teamById(match.homeTeamId), away = teamById(match.awayTeamId);
  const { h, a } = setsWon(match.sets);
  return (
    <Link href={`/partido/${match.id}`} className="card w-56 shrink-0 snap-start p-3">
      <span className="pill mb-2 bg-line/60 text-[10px] text-muted">FINAL</span>
      <Line team={home} score={h} win={h > a} />
      <Line team={away} score={a} win={a > h} />
    </Link>
  );
}

function Line({ team, score, win }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="flex min-w-0 items-center gap-2">
        <TeamLogo team={team} size={24} />
        <span className={`truncate text-sm ${win ? "font-bold text-snow" : "font-medium text-muted"}`}>{team?.name || "—"}</span>
      </span>
      <span className={`led text-lg ${win ? "text-court" : "text-muted"}`}>{score}</span>
    </div>
  );
}

function UpcomingCard({ match, teamById }) {
  const home = teamById(match.homeTeamId), away = teamById(match.awayTeamId);
  const d = match.date ? new Date(match.date) : null;
  return (
    <Link href={`/partido/${match.id}`} className="card w-56 shrink-0 snap-start p-3">
      <p className="mb-2 text-xs font-semibold text-court">
        {d ? d.toLocaleDateString("es", { day: "2-digit", month: "short" }) + " · " + d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }) : "Por definir"}
      </p>
      <Line team={home} />
      <Line team={away} />
    </Link>
  );
}

function LeaderCard({ p, rank, teamById }) {
  const team = teamById(p.teamId);
  return (
    <Link href="/estadisticas" className="card flex w-40 shrink-0 snap-start flex-col items-center gap-2 p-4 text-center">
      <div className="relative">
        <PlayerAvatar player={p} size={64} />
        <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber text-xs font-bold text-ink">{rank}</span>
      </div>
      <div>
        <p className="truncate text-sm font-bold text-snow">{p.playerName}</p>
        <p className="truncate text-xs text-muted">{team?.name || ""}</p>
      </div>
      <div><span className="led text-2xl">{totalPoints(p)}</span><span className="ml-1 text-[10px] font-bold text-muted">PTS</span></div>
    </Link>
  );
}
