"use client";

import { useEffect, useMemo, useState } from "react";
import { getPlayersByTeam, watchMatchStats, updateMatch, applyStatAction } from "@/lib/data";
import { ANNOTATOR_ACTIONS, totalPoints } from "@/lib/stats";

export default function Annotator({ match, teams, onBack }) {
  const home = teams.find((t) => t.id === match.homeTeamId);
  const away = teams.find((t) => t.id === match.awayTeamId);

  const [players, setPlayers] = useState({ home: [], away: [] });
  const [stats, setStats] = useState([]);
  const [activeTeam, setActiveTeam] = useState("home");
  const [activePlayer, setActivePlayer] = useState(null);
  const [correcting, setCorrecting] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    Promise.all([
      getPlayersByTeam(match.homeTeamId),
      getPlayersByTeam(match.awayTeamId),
    ]).then(([h, a]) =>
      setPlayers({
        home: h.sort((x, y) => (x.number || 0) - (y.number || 0)),
        away: a.sort((x, y) => (x.number || 0) - (y.number || 0)),
      })
    );
  }, [match.homeTeamId, match.awayTeamId]);

  useEffect(() => {
    const unsub = watchMatchStats(match.id, setStats);
    return () => unsub();
  }, [match.id]);

  const sets = match.sets || [];
  const curIndex = sets.length ? sets.length - 1 : 0;
  const cur = sets[curIndex] || { home: 0, away: 0 };
  let hs = 0, as = 0;
  for (const s of sets) {
    if ((s.home || 0) > (s.away || 0)) hs++;
    else if ((s.away || 0) > (s.home || 0)) as++;
  }

  const statFor = (pid) => stats.find((s) => s.playerId === pid) || {};

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1200);
  };

  const start = async () => {
    await updateMatch(match.id, {
      status: "live",
      sets: sets.length ? sets : [{ home: 0, away: 0 }],
    });
  };

  const changeScore = async (side, delta) => {
    if (match.status !== "live") return;
    const next = sets.map((s) => ({ ...s }));
    if (!next.length) next.push({ home: 0, away: 0 });
    const c = next[next.length - 1];
    c[side] = Math.max(0, (c[side] || 0) + delta);
    await updateMatch(match.id, { sets: next });
  };

  const newSet = async () => {
    const next = [...sets.map((s) => ({ ...s })), { home: 0, away: 0 }];
    await updateMatch(match.id, { sets: next });
  };

  const finish = async () => {
    if (!confirm("¿Finalizar el partido? Ya no se podrá anotar.")) return;
    const winner = hs > as ? match.homeTeamId : as > hs ? match.awayTeamId : null;
    await updateMatch(match.id, { status: "finished", winner });
    onBack();
  };

  const doAction = async (action) => {
    if (!activePlayer) return flash("Elegí un jugador primero");
    if (match.status !== "live") return flash("Iniciá el partido para anotar");
    const sign = correcting ? -1 : 1;
    const applyMap = {};
    for (const [k, v] of Object.entries(action.apply)) applyMap[k] = v * sign;
    await applyStatAction(match.id, activePlayer, applyMap);
    flash(`${correcting ? "−" : "+"} ${action.label} · ${activePlayer.name}`);
  };

  const roster = players[activeTeam] || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-ghost">← Volver</button>
        {match.status === "scheduled" && <button onClick={start} className="btn-primary">Iniciar partido</button>}
        {match.status === "live" && <button onClick={finish} className="btn-ghost text-coral">Finalizar</button>}
      </div>

      {/* Marcador */}
      <div className="scoreboard p-4">
        <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-wide text-white/50">
          <span>Set {sets.length || 1}</span>
          <span>Sets ganados {hs} — {as}</span>
        </div>
        <ScoreRow name={home?.name || "Local"} score={cur.home || 0} onInc={() => changeScore("home", 1)} onDec={() => changeScore("home", -1)} disabled={match.status !== "live"} />
        <div className="my-2 h-px bg-white/10" />
        <ScoreRow name={away?.name || "Visita"} score={cur.away || 0} onInc={() => changeScore("away", 1)} onDec={() => changeScore("away", -1)} disabled={match.status !== "live"} />
        {match.status === "live" && (
          <button onClick={newSet} className="mt-3 w-full rounded-xl border border-white/15 py-2 text-sm font-semibold text-amber">
            + Nuevo set
          </button>
        )}
      </div>

      {match.status === "scheduled" && (
        <p className="card px-4 py-3 text-sm text-muted">Iniciá el partido para habilitar el marcador y las estadísticas.</p>
      )}

      {/* Selección de equipo */}
      <div className="flex gap-2">
        {["home", "away"].map((side) => (
          <button
            key={side}
            onClick={() => { setActiveTeam(side); setActivePlayer(null); }}
            className={`flex-1 rounded-xl px-3 py-2 text-sm font-semibold ${activeTeam === side ? "bg-court text-white" : "border border-line bg-card text-muted"}`}
          >
            {(side === "home" ? home : away)?.name || (side === "home" ? "Local" : "Visita")}
          </button>
        ))}
      </div>

      {/* Jugadores */}
      {roster.length === 0 ? (
        <p className="card px-4 py-3 text-sm text-muted">
          Este equipo no tiene jugadores cargados. El roster se administra en la sección Equipos (Etapa 3).
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {roster.map((p) => {
            const s = statFor(p.id);
            const active = activePlayer?.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setActivePlayer(p)}
                className={`rounded-xl border px-2 py-2 text-left ${active ? "border-court bg-court/10" : "border-line bg-card"}`}
              >
                <p className="text-sm font-bold text-ink">
                  {p.number != null ? `#${p.number}` : p.name.slice(0, 8)}
                </p>
                <p className="truncate text-xs text-muted">{p.name}</p>
                <p className="mt-0.5 text-[11px] text-court">{totalPoints(s)} pts</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Acciones */}
      <div className="card p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-ink">
            {activePlayer ? `Anotando: ${activePlayer.name}` : "Elegí un jugador"}
          </span>
          <button
            onClick={() => setCorrecting((v) => !v)}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${correcting ? "bg-coral text-white" : "border border-line text-muted"}`}
          >
            {correcting ? "Corrigiendo (−)" : "Corregir"}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {ANNOTATOR_ACTIONS.map((a) => (
            <button
              key={a.key}
              onClick={() => doAction(a)}
              className={`stat-btn ${a.tone === "point" ? "stat-btn-point" : a.tone === "error" ? "stat-btn-error" : ""}`}
            >
              <span className="text-sm font-bold text-ink">{a.short}</span>
              <span className="mt-0.5 text-[10px] leading-tight text-muted">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white shadow-card">
          {toast}
        </div>
      )}
    </div>
  );
}

function ScoreRow({ name, score, onInc, onDec, disabled }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="min-w-0 flex-1 truncate font-semibold text-white">{name}</span>
      <div className="flex items-center gap-2">
        <button onClick={onDec} disabled={disabled} className="h-9 w-9 rounded-lg bg-white/10 text-lg font-bold text-white disabled:opacity-30">−</button>
        <span className="led w-12 text-center text-4xl">{score}</span>
        <button onClick={onInc} disabled={disabled} className="h-9 w-9 rounded-lg bg-amber text-lg font-bold text-ink disabled:opacity-30">+</button>
      </div>
    </div>
  );
}
