"use client";

import { useEffect, useState } from "react";
import { getPlayersByTeam, watchMatchStats, updateMatch, applyStatAction } from "@/lib/data";
import { ANNOTATOR_ACTIONS, totalPoints } from "@/lib/stats";
import { useAuth } from "@/context/AuthContext";
import { sendBroadcast } from "@/lib/messaging";

export default function Annotator({ match, teams, onBack }) {
  const { user } = useAuth();
  const home = teams.find((t) => t.id === match.homeTeamId);
  const away = teams.find((t) => t.id === match.awayTeamId);

  const [players, setPlayers] = useState({ home: [], away: [] });
  const [stats, setStats] = useState([]);
  const [activeTeam, setActiveTeam] = useState("home");
  const [activePlayer, setActivePlayer] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    Promise.all([getPlayersByTeam(match.homeTeamId), getPlayersByTeam(match.awayTeamId)]).then(([h, a]) =>
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
  const cur = sets[sets.length - 1] || { home: 0, away: 0 };
  const plays = match.plays || [];
  let hs = 0, as = 0;
  for (const s of sets) { if ((s.home || 0) > (s.away || 0)) hs++; else if ((s.away || 0) > (s.home || 0)) as++; }

  const statFor = (pid) => stats.find((s) => s.playerId === pid) || {};
  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(""), 1300); };
  const other = (side) => (side === "home" ? "away" : "home");
  const teamName = (side) => (side === "home" ? home : away)?.name || (side === "home" ? "Local" : "Visita");

  const start = async () => {
    await updateMatch(match.id, { status: "live", sets: sets.length ? sets : [{ home: 0, away: 0 }] });
    try {
      await sendBroadcast(user, "¡Empezó el partido!", `${home?.name || "Local"} vs ${away?.name || "Visita"} está en vivo.`);
      flash("Partido iniciado y aviso enviado");
    } catch { flash("Partido iniciado"); }
  };

  // Ajuste manual del marcador (para casos sin estadística)
  const bumpScore = async (side, delta) => {
    if (match.status !== "live") return;
    const next = sets.map((s) => ({ ...s }));
    if (!next.length) next.push({ home: 0, away: 0 });
    const c = next[next.length - 1];
    c[side] = Math.max(0, (c[side] || 0) + delta);
    await updateMatch(match.id, { sets: next });
  };

  const newSet = async () => {
    await updateMatch(match.id, { sets: [...sets.map((s) => ({ ...s })), { home: 0, away: 0 }] });
    flash("Nuevo set");
  };

  const finish = async () => {
    if (!confirm("¿Finalizar el partido? Ya no se podrá anotar.")) return;
    const winner = hs > as ? match.homeTeamId : as > hs ? match.awayTeamId : null;
    await updateMatch(match.id, { status: "finished", winner });
    onBack();
  };

  // NÚCLEO: registra la acción, suma el punto automáticamente y guarda la jugada.
  const recordAction = async (action) => {
    if (!activePlayer) return flash("Elegí un jugador primero");
    if (match.status !== "live") return flash("Iniciá el partido para anotar");

    const side = activeTeam;
    const scoreSide = action.scores === "team" ? side : action.scores === "opp" ? other(side) : null;

    // 1) estadística del jugador
    applyStatAction(match.id, activePlayer, action.apply).catch((e) => flash("No se guardó: " + (e?.message || "error")));

    // 2) marcador (automático) + jugada al historial
    const nextSets = sets.map((s) => ({ ...s }));
    if (!nextSets.length) nextSets.push({ home: 0, away: 0 });
    if (scoreSide) {
      const c = nextSets[nextSets.length - 1];
      c[scoreSide] = (c[scoreSide] || 0) + 1;
    }
    const play = {
      playerId: activePlayer.id, pn: activePlayer.name, num: activePlayer.number ?? null,
      teamId: activePlayer.teamId, team: side, label: action.label, apply: action.apply,
      scoreSide: scoreSide || null, ts: Date.now(),
    };
    const nextPlays = [...plays, play].slice(-40);
    await updateMatch(match.id, { sets: nextSets, plays: nextPlays });

    flash(scoreSide ? `PUNTO ${teamName(scoreSide)} · ${action.label}` : `${action.label} · ${activePlayer.name}`);
  };

  // Deshacer: revierte la última jugada (estadística + punto).
  const undo = async () => {
    if (match.status !== "live") return;
    if (!plays.length) return flash("No hay jugadas para deshacer");
    const last = plays[plays.length - 1];
    if (last.playerId && last.apply) {
      const neg = {}; for (const [k, v] of Object.entries(last.apply)) neg[k] = -v;
      applyStatAction(match.id, { id: last.playerId, name: last.pn, number: last.num, teamId: last.teamId }, neg).catch(() => {});
    }
    const nextSets = sets.map((s) => ({ ...s }));
    if (last.scoreSide && nextSets.length) {
      const c = nextSets[nextSets.length - 1];
      c[last.scoreSide] = Math.max(0, (c[last.scoreSide] || 0) - 1);
    }
    await updateMatch(match.id, { sets: nextSets, plays: plays.slice(0, -1) });
    flash("Deshecho: " + last.label);
  };

  const roster = players[activeTeam] || [];
  const toneClass = (t) => (t === "point" ? "bg-court" : t === "error" ? "bg-coral" : t === "good" ? "bg-teal text-ink" : "bg-[#3A4557]");

  return (
    <div className="-mt-5 space-y-4">
      <div className="flex items-center justify-between pt-2">
        <button onClick={onBack} className="flex items-center gap-1 text-sm font-semibold text-muted">
          <span className="mi" style={{ fontSize: 20 }}>arrow_back</span> Volver
        </button>
        <div className="flex items-center gap-2 text-sm text-muted">
          {match.status === "live" && <span className="live-badge">LIVE · Set {sets.length || 1}</span>}
          {match.court && <span>{match.court}</span>}
        </div>
      </div>

      {/* Marcador (se actualiza solo) */}
      <div className="scoreboard space-y-3 p-4">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-white/50">Sets {hs} - {as}</p>
        <ScoreRow name={home?.name || "Local"} tag="Local" score={cur.home || 0} onDec={() => bumpScore("home", -1)} onInc={() => bumpScore("home", 1)} disabled={match.status !== "live"} />
        <div className="h-px bg-white/10" />
        <ScoreRow name={away?.name || "Visita"} tag="Visita" score={cur.away || 0} onDec={() => bumpScore("away", -1)} onInc={() => bumpScore("away", 1)} disabled={match.status !== "live"} />

        {match.status === "scheduled" && (
          <button onClick={start} className="w-full rounded-full bg-court py-2.5 text-sm font-bold text-white">Iniciar partido</button>
        )}
        {match.status === "live" && (
          <div className="flex gap-2">
            <button onClick={undo} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white/10 py-2.5 text-sm font-bold text-white">
              <span className="mi" style={{ fontSize: 18 }}>undo</span> Deshacer
            </button>
            <button onClick={newSet} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white/10 py-2.5 text-sm font-bold text-amber">
              <span className="mi" style={{ fontSize: 18 }}>replay</span> Set
            </button>
            <button onClick={finish} className="rounded-full border border-coral/50 px-4 py-2.5 text-sm font-bold text-coral">Fin</button>
          </div>
        )}
        <p className="text-center text-[11px] text-white/40">El punto se suma solo según la acción. Usá ± para ajustes manuales.</p>
      </div>

      {match.status === "scheduled" && (
        <p className="card px-4 py-3 text-sm text-muted">Iniciá el partido para habilitar el marcador y las estadísticas.</p>
      )}

      {/* Últimas jugadas */}
      {plays.length > 0 && (
        <div className="card p-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Últimas jugadas</p>
          <div className="space-y-1.5">
            {plays.slice(-4).reverse().map((p, i) => (
              <div key={p.ts + "-" + i} className="flex items-center gap-2 text-sm">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.scoreSide ? "#22D3A0" : "#5B6675" }} />
                <span className="min-w-0 flex-1 truncate text-snow">
                  {p.scoreSide && <span className="font-bold text-teal">PUNTO {teamName(p.scoreSide)} · </span>}
                  {p.label}{p.num != null ? ` · #${p.num}` : ""} {p.pn}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs de equipo */}
      <div className="grid grid-cols-2 gap-2">
        {["home", "away"].map((side) => (
          <button key={side} onClick={() => { setActiveTeam(side); setActivePlayer(null); }}
            className={`rounded-xl py-2.5 text-sm font-bold ${activeTeam === side ? "bg-court text-white" : "border border-line bg-card text-muted"}`}>
            {teamName(side)}
          </button>
        ))}
      </div>

      {/* Jugadores */}
      {roster.length === 0 ? (
        <p className="card px-4 py-3 text-sm text-muted">Este equipo no tiene jugadores cargados. Cargalos en la sección Equipos.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {roster.map((p) => {
            const active = activePlayer?.id === p.id;
            return (
              <button key={p.id} onClick={() => setActivePlayer(p)}
                className={`relative rounded-xl border py-3 text-center ${active ? "border-2 border-court bg-court/10" : "border-line bg-card"}`}>
                {active && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-court" />}
                <p className={`led text-2xl ${active ? "text-court" : "text-snow"}`}>{p.number ?? "–"}</p>
                <p className="truncate px-1 text-xs font-semibold text-snow">{p.name}</p>
                <p className="text-[10px] text-court">{totalPoints(statFor(p.id))} pts</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Acciones (suman punto automáticamente) */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-snow">
          {activePlayer ? `Anotando: #${activePlayer.number ?? ""} ${activePlayer.name}` : "Elegí un jugador"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {ANNOTATOR_ACTIONS.map((a) => (
          <button key={a.key} onClick={() => recordAction(a)} className={`action-btn ${toneClass(a.tone)}`}>
            <span className="mi" style={{ fontSize: 24 }}>{a.icon}</span>
            <span className="flex items-center gap-1">
              {a.label}
              {a.scores === "team" && <span className="text-[10px] opacity-80">+1</span>}
              {a.scores === "opp" && <span className="text-[10px] opacity-80">+1 rival</span>}
            </span>
          </button>
        ))}
      </div>
      <p className="px-1 text-xs text-muted">Verde = suma sin punto (defensa/asistencia). Azul = punto propio. Rojo = error (punto al rival).</p>

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-court px-4 py-2 text-sm font-bold text-white shadow-card">
          {toast}
        </div>
      )}
    </div>
  );
}

function ScoreRow({ name, tag, score, onDec, onInc, disabled }) {
  return (
    <div className="flex items-center justify-between">
      <div className="min-w-0">
        <p className="truncate font-bold text-white">{name}</p>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40">{tag}</p>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={onDec} disabled={disabled} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-30">
          <span className="mi" style={{ fontSize: 20 }}>remove</span>
        </button>
        <span className="led w-14 text-center text-5xl leading-none">{score}</span>
        <button onClick={onInc} disabled={disabled} className="flex h-9 w-9 items-center justify-center rounded-full bg-amber text-ink disabled:opacity-30">
          <span className="mi" style={{ fontSize: 20 }}>add</span>
        </button>
      </div>
    </div>
  );
}
