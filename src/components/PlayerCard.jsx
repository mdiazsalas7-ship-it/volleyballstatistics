"use client";

import { useState } from "react";
import { totalPoints, hittingPct, fmtPct } from "@/lib/stats";
import { useBranding } from "@/context/BrandingContext";

function loadImg(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export default function PlayerCard({ player, team, stats, gp = 0, onClose }) {
  const { leagueName, logoUrl } = useBranding();
  const [sharing, setSharing] = useState(false);
  const accent = team?.color || "#FFC043";

  const s = stats || {};
  const cards = [
    { label: "PTS", color: "#FFC043", total: totalPoints(s) },
    { label: "KILLS", color: "#2F6BFF", total: s.kills || 0 },
    { label: "ACES", color: "#22D3A0", total: s.aces || 0 },
    { label: "BLOQ", color: "#FF5A5F", total: (s.blockSolo || 0) + (s.blockAssist || 0) },
  ].map((c) => ({ ...c, avg: gp > 0 ? (c.total / gp).toFixed(1) : "—" }));

  const share = async () => {
    setSharing(true);
    try {
      const W = 640, H = 900, M = 24;
      const canvas = document.createElement("canvas");
      canvas.width = W; canvas.height = H;
      const ctx = canvas.getContext("2d");
      const NAVY = "#0B1524", CARD = "#0E1B33";

      const rr = (x, y, w, h, r) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
      };

      // Fondo
      ctx.fillStyle = NAVY; ctx.fillRect(0, 0, W, H);
      const cx0 = M, cy0 = M, cw = W - M * 2, ch = H - M * 2;
      ctx.fillStyle = CARD; rr(cx0, cy0, cw, ch, 24); ctx.fill();
      ctx.strokeStyle = accent; ctx.lineWidth = 3; rr(cx0 + 1.5, cy0 + 1.5, cw - 3, ch - 3, 22); ctx.stroke();

      // Encabezado con marca de la liga
      const headH = 70;
      ctx.save(); rr(cx0, cy0, cw, headH + 20, 22); ctx.clip();
      ctx.fillStyle = accent; ctx.fillRect(cx0, cy0, cw, headH);
      ctx.restore();
      const headCY = cy0 + headH / 2;
      const leagueLogo = await loadImg(logoUrl || "/logo.png");
      if (leagueLogo) {
        ctx.save(); ctx.beginPath(); ctx.arc(cx0 + 42, headCY, 24, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
        ctx.drawImage(leagueLogo, cx0 + 18, headCY - 24, 48, 48); ctx.restore();
      }
      ctx.fillStyle = "#0B1524"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = "800 24px system-ui";
      ctx.fillText((leagueName || "Torneo Voley").toUpperCase().slice(0, 22), W / 2, headCY);

      // Foto
      const photoY = cy0 + headH, photoH = 470;
      ctx.save(); ctx.beginPath(); ctx.rect(cx0, photoY, cw, photoH); ctx.clip();
      ctx.fillStyle = "#0A1322"; ctx.fillRect(cx0, photoY, cw, photoH);
      // dorsal marca de agua
      if (player.number != null) {
        ctx.fillStyle = "rgba(255,255,255,0.06)"; ctx.textAlign = "right"; ctx.textBaseline = "alphabetic";
        ctx.font = "900 260px system-ui";
        ctx.fillText(String(player.number), cx0 + cw + 20, photoY + photoH + 30);
      }
      const photo = await loadImg(player.photoUrl);
      let drawn = false;
      if (photo) {
        try {
          const fh = photoH, fw = (photo.naturalWidth / photo.naturalHeight) * fh;
          ctx.drawImage(photo, cx0 + (cw - fw) / 2, photoY, fw, fh);
          drawn = true;
        } catch {}
      }
      if (!drawn) {
        ctx.fillStyle = accent + "cc"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.font = "900 160px system-ui";
        ctx.fillText((player.name || "?").charAt(0).toUpperCase(), W / 2, photoY + photoH * 0.45);
      }
      // fundido inferior
      const fade = ctx.createLinearGradient(0, photoY + photoH * 0.6, 0, photoY + photoH);
      fade.addColorStop(0, "rgba(14,27,51,0)"); fade.addColorStop(1, CARD);
      ctx.fillStyle = fade; ctx.fillRect(cx0, photoY, cw, photoH);
      ctx.restore();

      // Dorsal badge
      if (player.number != null) {
        ctx.fillStyle = accent; rr(cx0 + 20, photoY + 20, 84, 44, 12); ctx.fill();
        ctx.fillStyle = "#0B1524"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.font = "900 26px system-ui"; ctx.fillText("#" + player.number, cx0 + 62, photoY + 42);
      }

      // Nombre + equipo
      let y = photoY + photoH + 14;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff"; ctx.font = "900 34px system-ui";
      ctx.fillText((player.name || "").toUpperCase(), W / 2, y);
      y += 30;
      ctx.fillStyle = accent; ctx.font = "700 16px system-ui";
      ctx.fillText((team?.name || "").toUpperCase(), W / 2, y);

      // Stats
      y += 34;
      const gap = 12, cellW = (cw - gap * 3) / 4, cellH = 96;
      cards.forEach((c, i) => {
        const x = cx0 + i * (cellW + gap);
        ctx.fillStyle = "rgba(255,255,255,0.04)"; rr(x, y, cellW, cellH, 12); ctx.fill();
        ctx.fillStyle = c.color; ctx.fillRect(x, y, cellW, 3);
        ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "#fff"; ctx.font = "900 34px system-ui";
        ctx.fillText(String(c.total), x + cellW / 2, y + 46);
        ctx.fillStyle = "#8FA6C9"; ctx.font = "500 13px system-ui";
        ctx.fillText(c.avg === "—" ? "—" : c.avg + "/PJ", x + cellW / 2, y + 66);
        ctx.fillStyle = c.color; ctx.font = "800 13px system-ui";
        ctx.fillText(c.label, x + cellW / 2, y + 86);
      });

      // Pie
      const footY = y + cellH + 30;
      ctx.strokeStyle = accent + "55"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx0 + 20, footY - 14); ctx.lineTo(cx0 + cw - 20, footY - 14); ctx.stroke();
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#5B6B85"; ctx.font = "700 13px system-ui"; ctx.textAlign = "left";
      ctx.fillText("EDICIÓN OFICIAL", cx0 + 20, footY);
      ctx.fillStyle = accent; ctx.textAlign = "right";
      ctx.fillText("N° " + String(player.number ?? 0).padStart(3, "0"), cx0 + cw - 20, footY);

      await new Promise((res) => canvas.toBlob(async (blob) => {
        if (!blob) return res();
        const file = new File([blob], `${(player.name || "jugador").replace(/ /g, "_")}.png`, { type: "image/png" });
        try {
          if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: player.name });
          } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = file.name; a.click();
            URL.revokeObjectURL(url);
          }
        } catch {}
        res();
      }, "image/png"));
    } catch (e) {
      alert("No se pudo generar la imagen. Puede que la foto no permita compartirse.");
    } finally {
      setSharing(false);
    }
  };

  return (
    <div onClick={onClose} className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xs overflow-hidden rounded-3xl bg-[#0A1322]" style={{ boxShadow: `0 30px 80px rgba(0,0,0,.7), 0 0 0 1px ${accent}55` }}>
        <div style={{ height: 4, background: `linear-gradient(90deg, ${accent}, ${accent}44, transparent)` }} />
        <div className="relative h-72 overflow-hidden" style={{ background: `linear-gradient(160deg, ${accent}22, #0A1322)` }}>
          {player.number != null && (
            <div className="pointer-events-none absolute -bottom-5 -right-2 select-none font-black leading-none" style={{ fontSize: "9rem", color: "rgba(255,255,255,0.05)" }}>{player.number}</div>
          )}
          {player.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={player.photoUrl} alt={player.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="flex h-28 w-28 items-center justify-center rounded-full text-5xl font-black text-white" style={{ background: `radial-gradient(circle, ${accent}cc, ${accent}44)`, border: `2px solid ${accent}66` }}>
                {(player.name || "?").charAt(0).toUpperCase()}
              </div>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0A1322] to-transparent" />
          <button onClick={onClose} className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur">
            <span className="mi" style={{ fontSize: 18 }}>close</span>
          </button>
          {player.number != null && (
            <div className="absolute left-3 top-3 rounded-full px-3 py-1 text-sm font-black text-white" style={{ background: accent, boxShadow: `0 4px 12px ${accent}66` }}>#{player.number}</div>
          )}
        </div>

        <div className="bg-[#0A1322] px-3 pb-4 pt-2">
          <div className="mb-3 text-center">
            <div className="text-lg font-black uppercase tracking-wide text-white">{player.name}</div>
            <div className="mt-0.5 text-[11px] font-bold uppercase tracking-widest" style={{ color: accent }}>{team?.name || ""}</div>
          </div>
          <div className="mb-3 h-px" style={{ background: `linear-gradient(90deg, transparent, ${accent}66, transparent)` }} />
          <div className="mb-3 grid grid-cols-4 gap-1.5">
            {cards.map((c) => (
              <div key={c.label} className="relative overflow-hidden rounded-xl border p-2 text-center" style={{ borderColor: c.color + "33", background: "rgba(255,255,255,.04)" }}>
                <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: c.color }} />
                <div className="text-xl font-black leading-none text-white" style={{ textShadow: `0 0 12px ${c.color}88` }}>{c.total}</div>
                <div className="mt-1 text-[9px] text-white/40">{c.avg}/PJ</div>
                <div className="mt-0.5 text-[10px] font-black" style={{ color: c.color }}>{c.label}</div>
              </div>
            ))}
          </div>
          <button onClick={share} disabled={sharing} className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-black text-white disabled:opacity-60" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}bb)`, boxShadow: `0 4px 16px ${accent}55` }}>
            <span className="mi" style={{ fontSize: 18 }}>{sharing ? "hourglass_empty" : "ios_share"}</span>
            {sharing ? "Generando…" : "Compartir barajita"}
          </button>
        </div>
      </div>
    </div>
  );
}
