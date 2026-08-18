"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getTeams, watchMatches, createMatch, deleteMatch } from "@/lib/data";
import { useAuth } from "@/context/AuthContext";
import { Spinner, Empty, LiveBadge } from "@/components/ui";
import { TeamLogo } from "@/components/media";

export default function CalendarPage() {
  const { isAdmin } = useAuth();
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    getTeams().then(setTeams);
    const unsub = watchMatches((m) => { setMatches(m); setLoading(false); });
    return () => unsub();
  }, []);

  const teamById = (id) => teams.find((t) => t.id === id);

  const { upcoming, liveOnes, finished } = useMemo(() => ({
    liveOnes: matches.filter((m) => m.status === "live"),
    upcoming: matches.filter((m) => m.status === "scheduled"),
    finished: matches.filter((m) => m.status === "finished"),
  }), [matches]);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="h-display text-3xl">Partidos</h1>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
            <span className="mi" style={{ fontSize: 20 }}>{showForm ? "close" : "add"}</span>
            {showForm ? "Cerrar" : "Partido"}
          </button>
        )}
      </div>

      {isAdmin && showForm && <MatchForm teams={teams} onDone={() => setShowForm(false)} />}

      {liveOnes.map((m) => <LiveCard key={m.id} match={m} teamById={teamById} />)}

      <Section title="Próximos Partidos">
        {upcoming.length === 0 ? (
          <Empty title="Sin partidos programados" hint={isAdmin ? "Tocá + Partido para agendar uno." : "Aún no se publicó el fixture."} />
        ) : (
          <div className="space-y-3">
            {upcoming.map((m) => <UpcomingCard key={m.id} match={m} teamById={teamById} isAdmin={isAdmin} />)}
          </div>
        )}
      </Section>

      {finished.length > 0 && (
        <Section title="Resultados Recientes">
          <div className="space-y-3">
            {finished.map((m) => <ResultCard key={m.id} match={m} teamById={teamById} isAdmin={isAdmin} />)}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h2 className="h-display text-xl">{title}</h2>
      {children}
    </section>
  );
}

function dateLabel(iso) {
  if (!iso) return { top: "S/F", time: "--:--" };
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  const top = sameDay ? "HOY" : isTomorrow ? "MAÑ" : d.toLocaleDateString("es", { day: "2-digit", month: "short" }).toUpperCase();
  const time = d.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
  return { top, time };
}

function setsWon(sets = []) {
  let h = 0, a = 0;
  for (const s of sets) {
    if ((s.home || 0) > (s.away || 0)) h++;
    else if ((s.away || 0) > (s.home || 0)) a++;
  }
  return { h, a };
}

function LiveCard({ match, teamById }) {
  const home = teamById(match.homeTeamId);
  const away = teamById(match.awayTeamId);
  const sets = match.sets || [];
  const cur = sets[sets.length - 1] || { home: 0, away: 0 };
  const prev = sets.slice(0, -1).map((s) => `${s.home}-${s.away}`).join("  ");

  return (
    <div className="scoreboard p-5">
      <div className="mb-3 flex items-center justify-between">
        <LiveBadge />
        <span className="text-xs text-white/50">Set {sets.length || 1}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <TeamMini team={home} fallback="Local" />
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <span className="led text-4xl leading-none">{cur.home || 0}</span>
            <span className="text-2xl font-bold text-white/30">-</span>
            <span className="led text-4xl leading-none">{cur.away || 0}</span>
          </div>
          {prev && <span className="mt-1 text-xs text-white/40">{prev}</span>}
        </div>
        <TeamMini team={away} fallback="Visita" />
      </div>
      <Link href={`/partido/${match.id}`} className="mx-auto mt-4 flex w-max items-center gap-1.5 rounded-full bg-court px-5 py-2 text-sm font-semibold text-white">
        Ver detalles
      </Link>
    </div>
  );
}

function TeamMini({ team, fallback }) {
  return (
    <div className="flex w-20 flex-col items-center gap-1.5 text-center">
      <div className="rounded-full bg-white p-0.5"><TeamLogo team={team} size={48} /></div>
      <span className="truncate text-xs font-bold text-white">{team?.name || fallback}</span>
    </div>
  );
}

function UpcomingCard({ match, teamById, isAdmin }) {
  const { top, time } = dateLabel(match.date);
  const home = teamById(match.homeTeamId);
  const away = teamById(match.awayTeamId);
  return (
    <div className="card flex items-center gap-3 p-3">
      <div className="w-14 shrink-0 text-center">
        <p className="text-[11px] font-bold text-muted">{top}</p>
        <p className="led text-base text-snow">{time}</p>
      </div>
      <div className="h-10 w-px bg-line" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <TeamRow team={home} />
        <TeamRow team={away} />
      </div>
      {isAdmin ? (
        <button onClick={() => confirm("¿Eliminar este partido?") && deleteMatch(match.id)} className="text-muted hover:text-coral">
          <span className="mi" style={{ fontSize: 20 }}>delete</span>
        </button>
      ) : (
        <span className="mi text-muted" style={{ fontSize: 22 }}>chevron_right</span>
      )}
    </div>
  );
}

function TeamRow({ team }) {
  return (
    <div className="flex items-center gap-2">
      <TeamLogo team={team} size={22} />
      <span className="truncate text-sm font-semibold text-snow">{team?.name || "—"}</span>
    </div>
  );
}

function ResultCard({ match, teamById, isAdmin }) {
  const home = teamById(match.homeTeamId);
  const away = teamById(match.awayTeamId);
  const { h, a } = setsWon(match.sets);
  const details = (match.sets || []).map((s) => `${s.home}-${s.away}`).join(", ");
  const d = match.date ? new Date(match.date) : null;

  return (
    <Link href={`/partido/${match.id}`} className="card block p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-muted">
          {d ? d.toLocaleDateString("es", { day: "2-digit", month: "short" }) : ""}{match.court ? ` · ${match.court}` : ""}
        </span>
        <span className="pill bg-line/60 text-[10px] text-muted">FINAL</span>
      </div>
      <ResultRow team={home} score={h} win={h > a} />
      <ResultRow team={away} score={a} win={a > h} />
      {details && <p className="mt-1.5 text-xs text-muted">{details}</p>}
      {isAdmin && (
        <button
          onClick={(e) => { e.preventDefault(); confirm("¿Eliminar este partido?") && deleteMatch(match.id); }}
          className="mt-2 text-xs text-muted hover:text-coral"
        >
          Eliminar
        </button>
      )}
    </Link>
  );
}

function ResultRow({ team, score, win }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="flex items-center gap-2">
        <TeamLogo team={team} size={24} />
        <span className={`text-sm ${win ? "font-bold text-snow" : "font-medium text-muted"}`}>{team?.name || "—"}</span>
      </span>
      <span className={`led text-lg ${win ? "text-court" : "text-muted"}`}>{score}</span>
    </div>
  );
}

function MatchForm({ teams, onDone }) {
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const [date, setDate] = useState("");
  const [court, setCourt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (!home || !away) return setError("Elegí ambos equipos.");
    if (home === away) return setError("Los equipos deben ser distintos.");
    setSaving(true);
    try {
      await createMatch({
        homeTeamId: home, awayTeamId: away,
        date: date ? new Date(date).toISOString() : null,
        court: court || null,
      });
      onDone();
    } catch {
      setError("No se pudo guardar. Revisá permisos de Firestore.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card space-y-3 p-4">
      <div className="grid grid-cols-2 gap-3">
        <Select label="Local" value={home} onChange={setHome} teams={teams} />
        <Select label="Visitante" value={away} onChange={setAway} teams={teams} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha y hora"><input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="input" /></Field>
        <Field label="Cancha / lugar"><input value={court} onChange={(e) => setCourt(e.target.value)} placeholder="Cancha 1" className="input" /></Field>
      </div>
      {error && <p className="text-sm text-coral">{error}</p>}
      <div className="flex gap-2">
        <button className="btn-primary" disabled={saving} onClick={submit}>{saving ? "Guardando…" : "Programar"}</button>
        <button className="btn-ghost" onClick={onDone}>Cancelar</button>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted">{label}</span>
      {children}
    </label>
  );
}
function Select({ label, value, onChange, teams }) {
  return (
    <Field label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input">
        <option value="">Elegir…</option>
        {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>
    </Field>
  );
}
