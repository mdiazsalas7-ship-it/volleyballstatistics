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
  const [correcting, setCorrecting] = useState(false);
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
  let hs = 0, as = 0;
  for (const s of sets) {
    if ((s.home || 0) > (s.away || 0)) hs++;
    else if ((s.away || 0) > (s.home || 0)) as++;
  }

  const statFor = (pid) => stats.find((s) => s.playerId === pid) || {};
  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(""), 1200); };

  const start = async () => {
    await updateMatch(match.id, { status: "live", sets: sets.length ? sets : [{ home: 0, away: 0 }] });
    try {
      await sendBroadcast(user, "¡Empezó el partido!", `${home?.name || "Local"} vs ${away?.name || "Visita"} está en vivo.`);
      flash("Partido iniciado y aviso enviado");
    } catch { flash("Partido iniciado"); }
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
    flash("Nuevo set");
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
  const toneClass = (t) => (t === "point" ? "bg-court" : t === "error" ? "bg-coral" : "bg-[#3A4557]");

  return (
    <div className="-mt-5 space-y-4">
      {/* Barra superior */}
      <div className="flex items-center justify-between pt-2">
        <button onClick={onBack} className="flex items-center gap-1 text-sm font-semibold text-muted">
          <span className="mi" style={{ fontSize: 20 }}>arrow_back</span> Volver
        </button>
        <div className="flex items-center gap-2 text-sm text-muted">
          {match.status === "live" && (
            <span className="live-badge">LIVE · Set {sets.length || 1}</span>
          )}
          {match.court && <span>{match.court}</span>}
        </div>
      </div>

      {/* Marcador con botones */}
      <div className="scoreboard space-y-3 p-4">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-white/50">
          Sets {hs} - {as}
        </p>
        <ScoreRow name={home?.name || "Local"} tag="Local" score={cur.home || 0}
          onDec={() => changeScore("home", -1)} onInc={() => changeScore("home", 1)} disabled={match.status !== "live"} />
        <div className="h-px bg-white/10" />
        <ScoreRow name={away?.name || "Visita"} tag="Visita" score={cur.away || 0}
          onDec={() => changeScore("away", -1)} onInc={() => changeScore("away", 1)} disabled={match.status !== "live"} />

        {match.status === "scheduled" && (
          <button onClick={start} className="w-full rounded-full bg-court py-2.5 text-sm font-bold text-white">Iniciar partido</button>
        )}
        {match.status === "live" && (
          <div className="flex gap-2">
            <button onClick={newSet} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white/10 py-2.5 text-sm font-bold text-amber">
              <span className="mi" style={{ fontSize: 18 }}>replay</span> Nuevo Set
            </button>
            <button onClick={finish} className="rounded-full border border-coral/50 px-4 py-2.5 text-sm font-bold text-coral">Finalizar</button>
          </div>
        )}
      </div>

      {match.status === "scheduled" && (
        <p className="card px-4 py-3 text-sm text-muted">Iniciá el partido para habilitar el marcador y las estadísticas.</p>
      )}

      {/* Tabs de equipo */}
      <div className="grid grid-cols-2 gap-2">
        {["home", "away"].map((side) => (
          <button key={side} onClick={() => { setActiveTeam(side); setActivePlayer(null); }}
            className={`rounded-xl py-2.5 text-sm font-bold ${activeTeam === side ? "bg-court text-white" : "border border-line bg-card text-muted"}`}>
            {(side === "home" ? home : away)?.name || (side === "home" ? "Local" : "Visita")}
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
                className={`relative rounded-xl border py-3 text-center ${active ? "border-2 border-court bg-court/5" : "border-line bg-card"}`}>
                {active && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-court" />}
                <p className={`led text-2xl ${active ? "text-court" : "text-ink"}`}>{p.number ?? "–"}</p>
                <p className="truncate px-1 text-xs font-semibold text-ink">{p.name}</p>
                <p className="text-[10px] text-court">{totalPoints(statFor(p.id))} pts</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Acciones */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">
          {activePlayer ? `Anotando: #${activePlayer.number ?? ""} ${activePlayer.name}` : "Elegí un jugador"}
        </span>
        <button onClick={() => setCorrecting((v) => !v)}
          className={`pill ${correcting ? "bg-coral text-white" : "border border-line text-muted"}`}>
          {correcting ? "Corrigiendo (−)" : "Corregir"}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {ANNOTATOR_ACTIONS.map((a) => (
          <button key={a.key} onClick={() => doAction(a)} className={`action-btn ${toneClass(a.tone)} ${correcting ? "opacity-90 ring-2 ring-coral/40" : ""}`}>
            <span className="mi" style={{ fontSize: 26 }}>{a.icon}</span>
            {a.label}
          </button>
        ))}
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white shadow-card">
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
        <button onClick={onDec} disabled={disabled} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-30">
          <span className="mi" style={{ fontSize: 22 }}>remove</span>
        </button>
        <span className="led w-14 text-center text-5xl leading-none">{score}</span>
        <button onClick={onInc} disabled={disabled} className="flex h-10 w-10 items-center justify-center rounded-full bg-amber text-ink disabled:opacity-30">
          <span className="mi" style={{ fontSize: 22 }}>add</span>
        </button>
      </div>
    </div>
  );
}
