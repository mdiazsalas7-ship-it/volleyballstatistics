"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getTeams, watchMatches, createMatch, deleteMatch } from "@/lib/data";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, Spinner, Empty, LiveBadge } from "@/components/ui";

export default function CalendarPage() {
  const { isAdmin } = useAuth();
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    getTeams().then(setTeams);
    const unsub = watchMatches((m) => {
      setMatches(m);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const teamName = (id) => teams.find((t) => t.id === id)?.name || "—";

  const { upcoming, liveOnes, finished } = useMemo(() => {
    return {
      liveOnes: matches.filter((m) => m.status === "live"),
      upcoming: matches.filter((m) => m.status === "scheduled"),
      finished: matches.filter((m) => m.status === "finished"),
    };
  }, [matches]);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fixture"
        title="Calendario"
        action={
          isAdmin ? (
            <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
              {showForm ? "Cerrar" : "+ Partido"}
            </button>
          ) : null
        }
      />

      {isAdmin && showForm && (
        <MatchForm
          teams={teams}
          onDone={() => setShowForm(false)}
        />
      )}

      {liveOnes.length > 0 && (
        <Section label={<span className="flex items-center gap-2"><LiveBadge /> En vivo</span>}>
          {liveOnes.map((m) => (
            <MatchCard key={m.id} match={m} teamName={teamName} isAdmin={isAdmin} />
          ))}
        </Section>
      )}

      <Section label="Próximos">
        {upcoming.length === 0 ? (
          <Empty title="Sin partidos programados" hint={isAdmin ? "Usá el botón + Partido para agendar uno." : "Aún no se ha publicado el fixture."} />
        ) : (
          upcoming.map((m) => <MatchCard key={m.id} match={m} teamName={teamName} isAdmin={isAdmin} />)
        )}
      </Section>

      {finished.length > 0 && (
        <Section label="Resultados">
          {finished.map((m) => <MatchCard key={m.id} match={m} teamName={teamName} isAdmin={isAdmin} />)}
        </Section>
      )}
    </div>
  );
}

function Section({ label, children }) {
  return (
    <section className="space-y-2">
      <h2 className="px-1 text-sm font-semibold text-ink">{label}</h2>
      {children}
    </section>
  );
}

function MatchCard({ match, teamName, isAdmin }) {
  const sets = match.sets || [];
  let hs = 0, as = 0;
  for (const s of sets) {
    if ((s.home || 0) > (s.away || 0)) hs++;
    else if ((s.away || 0) > (s.home || 0)) as++;
  }
  const date = match.date ? new Date(match.date) : null;

  return (
    <div className="card flex items-center justify-between gap-3 px-4 py-3">
      <Link href={`/partido/${match.id}`} className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-sm font-semibold text-ink">{teamName(match.homeTeamId)}</p>
          {match.status !== "scheduled" && <span className="led text-court">{hs}</span>}
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-sm font-semibold text-ink">{teamName(match.awayTeamId)}</p>
          {match.status !== "scheduled" && <span className="led text-court">{as}</span>}
        </div>
        <p className="mt-1 text-xs text-muted">
          {date ? date.toLocaleString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "Fecha por definir"}
          {match.court ? ` · ${match.court}` : ""}
        </p>
      </Link>
      {isAdmin && (
        <button
          onClick={() => confirm("¿Eliminar este partido?") && deleteMatch(match.id)}
          className="shrink-0 rounded-lg border border-line px-2 py-1 text-xs text-muted hover:text-coral"
          aria-label="Eliminar partido"
        >
          ✕
        </button>
      )}
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
        homeTeamId: home,
        awayTeamId: away,
        date: date ? new Date(date).toISOString() : null,
        court: court || null,
      });
      onDone();
    } catch (e) {
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
        <Field label="Fecha y hora">
          <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
        </Field>
        <Field label="Cancha / lugar">
          <input value={court} onChange={(e) => setCourt(e.target.value)} placeholder="Cancha 1" className="input" />
        </Field>
      </div>
      {error && <p className="text-sm text-coral">{error}</p>}
      <div className="flex gap-2">
        <button className="btn-primary" disabled={saving} onClick={submit}>
          {saving ? "Guardando…" : "Programar partido"}
        </button>
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
        {teams.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
    </Field>
  );
}
