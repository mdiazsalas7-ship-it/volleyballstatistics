// Definición central de las estadísticas que registra la app.
// Basado en las 6 categorías estándar del voleibol (ataque, saque,
// recepción, colocación, bloqueo, defensa). En el MVP registramos la
// "Big Five" + errores. Cada acción del anotador incrementa un contador.

// Contadores que guarda cada documento matches/{id}/stats/{playerId}
export const STAT_KEYS = [
  "kills", // K  - punto de ataque
  "attackErrors", // AE - error de ataque
  "attackAttempts", // TA - intentos totales de ataque
  "aces", // SA - as de saque
  "serveErrors", // SE - error de saque
  "blockSolo", // BS - bloqueo solo
  "blockAssist", // BA - bloqueo asistido
  "digs", // D  - defensa
  "assists", // A  - asistencia
  "receptionErrors", // RE - error de recepción
];

// Botones del anotador (mesa técnica). delta puede afectar varios contadores.
export const ANNOTATOR_ACTIONS = [
  { key: "kill", label: "Kill", short: "K", tone: "point", icon: "sports_volleyball", apply: { kills: 1, attackAttempts: 1 } },
  { key: "attackError", label: "Error atq.", short: "AE", tone: "error", icon: "cancel", apply: { attackErrors: 1, attackAttempts: 1 } },
  { key: "attackIn", label: "Atq. en juego", short: "0", tone: "neutral", icon: "arrow_forward", apply: { attackAttempts: 1 } },
  { key: "ace", label: "As", short: "SA", tone: "point", icon: "star", apply: { aces: 1 } },
  { key: "serveError", label: "Error saque", short: "SE", tone: "error", icon: "cancel", apply: { serveErrors: 1 } },
  { key: "blockSolo", label: "Bloqueo", short: "BS", tone: "point", icon: "shield", apply: { blockSolo: 1 } },
  { key: "blockAssist", label: "Bloqueo asist.", short: "BA", tone: "point", icon: "front_hand", apply: { blockAssist: 1 } },
  { key: "dig", label: "Defensa", short: "D", tone: "point", icon: "pan_tool", apply: { digs: 1 } },
  { key: "assist", label: "Asistencia", short: "A", tone: "point", icon: "handshake", apply: { assists: 1 } },
  { key: "receptionError", label: "Error recep.", short: "RE", tone: "error", icon: "cancel", apply: { receptionErrors: 1 } },
];

export function emptyStats() {
  return STAT_KEYS.reduce((acc, k) => ((acc[k] = 0), acc), {});
}

// Puntos totales del jugador = kills + ases + bloqueos
export function totalPoints(s) {
  return (s.kills || 0) + (s.aces || 0) + (s.blockSolo || 0) + (s.blockAssist || 0);
}

// Eficiencia de ataque = (kills - errores) / intentos
export function hittingPct(s) {
  const ta = s.attackAttempts || 0;
  if (!ta) return 0;
  return ((s.kills || 0) - (s.attackErrors || 0)) / ta;
}

export function fmtPct(v) {
  // formato clásico de voleibol: .350  / -.100
  const sign = v < 0 ? "-" : "";
  const abs = Math.abs(v).toFixed(3).slice(1); // ".350"
  return sign + abs;
}

// Suma dos objetos de stats (para agregados de torneo)
export function addStats(a, b) {
  const out = { ...a };
  for (const k of STAT_KEYS) out[k] = (a[k] || 0) + (b[k] || 0);
  return out;
}
