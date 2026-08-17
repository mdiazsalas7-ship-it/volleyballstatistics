// Logo de equipo (circular) y foto de jugador, con respaldos elegantes.

export function TeamLogo({ team, size = 40, ring = false }) {
  const s = { width: size, height: size };
  const ringCls = ring ? "ring-2 ring-amber ring-offset-2 ring-offset-ink" : "";
  if (team?.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={team.logoUrl}
        alt={team.name || ""}
        style={s}
        className={`shrink-0 rounded-full object-cover ${ringCls}`}
      />
    );
  }
  return (
    <span
      style={{ ...s, background: team?.color || "#1B4FD1", fontSize: size * 0.36 }}
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${ringCls}`}
    >
      {(team?.name || "?").slice(0, 2).toUpperCase()}
    </span>
  );
}

export function PlayerAvatar({ player, size = 40, square = false }) {
  const s = { width: size, height: size };
  const shape = square ? "rounded-xl" : "rounded-full";
  if (player?.photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img src={player.photoUrl} alt={player.name || ""} style={s} className={`shrink-0 object-cover ${shape}`} />
    );
  }
  return (
    <span style={s} className={`flex shrink-0 items-center justify-center bg-court/10 text-court ${shape}`}>
      <span className="mi" style={{ fontSize: size * 0.5 }}>person</span>
    </span>
  );
}
