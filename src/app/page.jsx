"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getTeams, watchMatches, watchNews, getAllPlayerStats } from "@/lib/data";
import { computeStandings } from "@/lib/standings";
import { addStats, emptyStats, totalPoints } from "@/lib/stats";
import { Spinner, LiveBadge } from "@/components/ui";
import { TeamLogo, PlayerAvatar } from "@/components/media";
import NewsTicker from "@/components/NewsTicker";

// Rotador automático de índice
function useRotator(length, ms = 5000) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (length <= 1) return;
    const id = setInterval(() => setI((p) => (p + 1) % length), ms);
    return () => clearInterval(id);
  }, [length, ms]);
  return length ? i % length : 0;
}

function setsWon(sets = []) {
  let h = 0, a = 0;
  for (const s of sets) { if ((s.home || 0) > (s.away || 0)) h++; else if ((s.away || 0) > (s.home || 0)) a++; }
  return { h, a };
}

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
  const teamName = (id) => teamById(id)?.name || "—";

  const live = matches.filter((m) => m.status === "live");
  const finished = matches.filter((m) => m.status === "finished").slice(-6).reverse();
  const upcoming = matches.filter((m) => m.status === "scheduled").slice(0, 3);
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
    return Object.values(map).sort((a, b) => totalPoints(b) - totalPoints(a)).filter((p) => totalPoints(p) > 0).slice(0, 5);
  }, [rawStats]);

  // Items para la cinta
  const tickerItems = useMemo(() => {
    const t = [];
    live.forEach((m) => {
      const s = m.sets || []; const c = s[s.length - 1] || { home: 0, away: 0 };
      t.push({ type: "envivo", text: `EN VIVO · ${teamName(m.homeTeamId)} ${c.home || 0}-${c.away || 0} ${teamName(m.awayTeamId)}` });
    });
    news.slice(0, 3).forEach((n) => t.push({ type: "noticia", text: n.title }));
    finished.slice(0, 4).forEach((m) => { const { h, a } = setsWon(m.sets); t.push({ type: "resultado", text: `${teamName(m.homeTeamId)} ${h}-${a} ${teamName(m.awayTeamId)}` }); });
    upcoming.forEach((m) => { const d = m.date ? new Date(m.date) : null; t.push({ type: "proximo", text: `PRÓXIMO: ${teamName(m.homeTeamId)} vs ${teamName(m.awayTeamId)}${d ? " · " + d.toLocaleDateString("es", { day: "2-digit", month: "short" }) : ""}` }); });
    leaders.slice(0, 3).forEach((p) => t.push({ type: "lider", text: `LÍDER: ${p.playerName} · ${totalPoints(p)} pts` }));
    return t;
  }, [live, news, finished, upcoming, leaders, teams]);

  if (loading) return <Spinner />;

  const empty = live.length === 0 && finished.length === 0 && upcoming.length === 0 && news.length === 0 && leaders.length === 0;

  return (
    <div className="pb-4">
      <NewsTicker items={tickerItems} />

      <div className="space-y-7">
        {live.map((m) => <LiveCard key={m.id} match={m} teamById={teamById} />)}

        {news.length > 0 && (
          <Section title="Noticias" href="/noticias" cta="Ver todas">
            <NewsBanner news={news} />
          </Section>
        )}

        {finished.length > 0 && (
          <Section title="Últimos resultados" href="/calendario" cta="Ver todos">
            <ResultHero results={finished} teamById={teamById} />
          </Section>
        )}

        {leaders.length > 0 && (
          <Section title="Líderes de la liga" href="/estadisticas" cta="Ver todos">
            <LeaderCard leaders={leaders} teamById={teamById} />
          </Section>
        )}

        {upcoming.length > 0 && (
          <Section title="Próximos partidos" href="/calendario" cta="Ver todos">
            <div className="space-y-2.5">
              {upcoming.map((m) => <UpcomingRow key={m.id} match={m} teamById={teamById} />)}
            </div>
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

        {empty && (
          <div className="card px-6 py-16 text-center">
            <span className="mi mb-2 text-muted" style={{ fontSize: 44 }}>sports_volleyball</span>
            <p className="h-display text-lg">Bienvenido</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted">Cuando el administrador cargue equipos, partidos y noticias, tu resumen aparecerá acá.</p>
          </div>
        )}
      </div>
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

function Dots({ n, active }) {
  if (n <= 1) return null;
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: n }).map((_, i) => (
        <span key={i} className="h-1.5 rounded-full transition-all" style={{ width: i === active ? 16 : 6, background: i === active ? "#fff" : "rgba(255,255,255,.4)" }} />
      ))}
    </div>
  );
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
        <TeamCol team={home} fallback="Local" />
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <span className="led text-5xl leading-none">{cur.home || 0}</span>
            <span className="text-3xl font-bold text-white/25">-</span>
            <span className="led text-5xl leading-none">{cur.away || 0}</span>
          </div>
          <span className="mt-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">Sets: {h} - {a}</span>
        </div>
        <TeamCol team={away} fallback="Visita" />
      </div>
    </Link>
  );
}

function TeamCol({ team, fallback }) {
  return (
    <div className="flex w-20 flex-col items-center gap-2 text-center">
      <div className="rounded-full bg-white p-0.5"><TeamLogo team={team} size={52} /></div>
      <span className="truncate text-xs font-bold uppercase text-white">{team?.name || fallback}</span>
    </div>
  );
}

function NewsBanner({ news }) {
  const idx = useRotator(news.length, 6000);
  const n = news[idx];
  return (
    <Link href={`/noticias/${n.id}`} className="relative block h-56 overflow-hidden rounded-2xl border border-line">
      <div className="absolute inset-0 bg-gradient-to-br from-court to-ink" />
      {n.imageUrl && (
        <img key={n.id} src={n.imageUrl} alt="" className="fade-in absolute inset-0 h-full w-full object-cover opacity-70" />
      )}
      <div className="absolute left-3 top-3 z-10 rounded-full bg-amber px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-ink shadow">Prensa</div>
      <div className="absolute right-3 top-4 z-10"><Dots n={news.length} active={idx} /></div>
      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/95 via-black/50 to-transparent px-4 pb-4 pt-14">
        <p key={n.id} className="fade-in line-clamp-2 text-lg font-extrabold leading-snug text-white" style={{ textShadow: "0 2px 8px rgba(0,0,0,.6)" }}>{n.title}</p>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-xs font-bold uppercase text-amber">Boletín</span>
          <span className="text-xs font-semibold text-white/70">Leer más →</span>
        </div>
      </div>
    </Link>
  );
}

function ResultHero({ results, teamById }) {
  const idx = useRotator(results.length, 5000);
  const m = results[idx];
  const home = teamById(m.homeTeamId), away = teamById(m.awayTeamId);
  const { h, a } = setsWon(m.sets);
  const detail = (m.sets || []).map((s) => `${s.home}-${s.away}`).join("  ");
  return (
    <Link href={`/partido/${m.id}`} className="relative block overflow-hidden rounded-2xl border border-line" style={{ background: "linear-gradient(135deg,#15234a,#0e1b33)" }}>
      <div className="absolute left-3 top-3"><span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-white/80">FINAL</span></div>
      <div className="absolute right-3 top-3"><Dots n={results.length} active={idx} /></div>
      <div key={m.id} className="fade-in flex items-center justify-between gap-2 px-4 pb-4 pt-9">
        <HeroTeam team={home} fallback="Local" win={h > a} />
        <div className="flex flex-col items-center">
          <span className="led text-4xl leading-none text-white">{h}<span className="px-1 text-white/30">-</span>{a}</span>
          {detail && <span className="mt-1 text-[11px] text-white/40">{detail}</span>}
        </div>
        <HeroTeam team={away} fallback="Visita" win={a > h} />
      </div>
    </Link>
  );
}

function HeroTeam({ team, fallback, win }) {
  return (
    <div className="flex w-24 flex-col items-center gap-1.5 text-center">
      <div className="rounded-full bg-white p-0.5"><TeamLogo team={team} size={44} /></div>
      <span className={`truncate text-xs ${win ? "font-extrabold text-white" : "font-medium text-white/70"}`}>{team?.name || fallback}</span>
    </div>
  );
}

function LeaderCard({ leaders, teamById }) {
  const idx = useRotator(leaders.length, 5000);
  const p = leaders[idx];
  const team = teamById(p.teamId);
  const val = totalPoints(p);
  const accent = "#FFC043";
  return (
    <Link href="/estadisticas" className="relative block overflow-hidden rounded-2xl" style={{ background: "linear-gradient(135deg,#0f1c34,#15233f,#0f1c34)", border: `2px solid ${accent}`, boxShadow: `0 10px 30px ${accent}30` }}>
      <div className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(45deg,transparent,transparent 14px,rgba(255,255,255,.02) 14px,rgba(255,255,255,.02) 15px)" }} />
      <div className="flex items-center justify-between px-4 py-2" style={{ background: `linear-gradient(90deg,${accent},${accent}cc)` }}>
        <span className="flex items-center gap-1.5 text-[13px] font-extrabold text-ink"><span className="mi mi-fill" style={{ fontSize: 16 }}>emoji_events</span> LÍDER · PUNTOS</span>
        <Dots n={leaders.length} active={idx} />
      </div>
      <div key={p.playerId} className="fade-in relative flex items-center gap-4 px-4 py-5">
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 font-extrabold leading-none" style={{ fontSize: "6.5rem", color: accent, opacity: 0.1 }}>{val}</span>
        <div className="relative shrink-0">
          <span className="absolute -inset-1.5 rounded-full" style={{ background: `radial-gradient(circle,${accent}55,transparent 70%)`, filter: "blur(6px)" }} />
          <div className="relative rounded-full" style={{ border: `3px solid ${accent}`, boxShadow: `0 0 20px ${accent}70` }}>
            <PlayerAvatar player={p} size={92} />
          </div>
        </div>
        <div className="z-10 min-w-0 flex-1">
          <p className="truncate text-lg font-extrabold text-white">{p.playerName}</p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <TeamLogo team={team} size={18} />
            <span className="truncate text-xs font-semibold uppercase tracking-wide text-muted">{team?.name || ""}</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="led text-3xl" style={{ color: accent }}>{val}</span>
            <span className="text-[11px] font-bold uppercase text-muted">puntos</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function UpcomingRow({ match, teamById }) {
  const home = teamById(match.homeTeamId), away = teamById(match.awayTeamId);
  const d = match.date ? new Date(match.date) : null;
  return (
    <Link href={`/partido/${match.id}`} className="card flex items-center gap-3 p-3">
      <div className="w-14 shrink-0 text-center">
        <p className="text-[11px] font-bold text-muted">{d ? d.toLocaleDateString("es", { day: "2-digit", month: "short" }).toUpperCase() : "S/F"}</p>
        <p className="led text-sm text-snow">{d ? d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }) : "--:--"}</p>
      </div>
      <div className="h-10 w-px bg-line" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center gap-2"><TeamLogo team={home} size={22} /><span className="truncate text-sm font-semibold text-snow">{home?.name || "—"}</span></div>
        <div className="flex items-center gap-2"><TeamLogo team={away} size={22} /><span className="truncate text-sm font-semibold text-snow">{away?.name || "—"}</span></div>
      </div>
      <span className="mi text-muted" style={{ fontSize: 22 }}>chevron_right</span>
    </Link>
  );
}
