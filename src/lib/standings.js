// Calcula la tabla de posiciones a partir de los partidos finalizados.
// Sistema de puntos configurable (por defecto FIVB):
//   victoria 3-0 / 3-1  -> 3 pts ganador, 0 perdedor
//   victoria 3-2        -> 2 pts ganador, 1 pt perdedor
// Desempates: puntos -> ratio de sets -> ratio de puntos.

export function computeStandings(teams, matches) {
  const table = {};
  for (const t of teams) {
    table[t.id] = {
      teamId: t.id,
      name: t.name,
      color: t.color || "#1B4FD1",
      played: 0,
      won: 0,
      lost: 0,
      setsFor: 0,
      setsAgainst: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      tablePoints: 0,
    };
  }

  for (const m of matches) {
    if (m.status !== "finished") continue;
    const home = table[m.homeTeamId];
    const away = table[m.awayTeamId];
    if (!home || !away) continue;

    const sets = m.sets || [];
    let homeSets = 0;
    let awaySets = 0;
    for (const s of sets) {
      const hs = Number(s.home) || 0;
      const as = Number(s.away) || 0;
      home.pointsFor += hs;
      home.pointsAgainst += as;
      away.pointsFor += as;
      away.pointsAgainst += hs;
      if (hs > as) homeSets++;
      else if (as > hs) awaySets++;
    }

    home.played++;
    away.played++;
    home.setsFor += homeSets;
    home.setsAgainst += awaySets;
    away.setsFor += awaySets;
    away.setsAgainst += homeSets;

    const homeWon = homeSets > awaySets;
    const winner = homeWon ? home : away;
    const loser = homeWon ? away : home;
    winner.won++;
    loser.lost++;

    // puntos de clasificación
    const decider = homeSets === 2 && awaySets === 2; // llegó al set decisivo (mejor de 5)
    const closeBo3 = homeSets === 1 && awaySets === 1; // set decisivo en mejor de 3
    if (decider || closeBo3) {
      winner.tablePoints += 2;
      loser.tablePoints += 1;
    } else {
      winner.tablePoints += 3;
    }
  }

  const rows = Object.values(table);
  rows.sort((a, b) => {
    if (b.tablePoints !== a.tablePoints) return b.tablePoints - a.tablePoints;
    if (b.won !== a.won) return b.won - a.won;
    const ra = setRatio(a);
    const rb = setRatio(b);
    if (rb !== ra) return rb - ra;
    return pointRatio(b) - pointRatio(a);
  });
  return rows;
}

function setRatio(r) {
  return r.setsAgainst === 0 ? r.setsFor : r.setsFor / r.setsAgainst;
}
function pointRatio(r) {
  return r.pointsAgainst === 0 ? r.pointsFor : r.pointsFor / r.pointsAgainst;
}
