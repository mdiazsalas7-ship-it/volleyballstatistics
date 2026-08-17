"use client";

import { useEffect, useState } from "react";
import { enableNotifications } from "@/lib/messaging";
import { useAuth } from "@/context/AuthContext";

export default function NotificationToggle() {
  const { user } = useAuth();
  const [state, setState] = useState("idle"); // idle | loading | on | error
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      setState("on");
    }
  }, []);

  const enable = async () => {
    setState("loading");
    setMsg("");
    try {
      await enableNotifications(user?.uid);
      setState("on");
      setMsg("¡Listo! Vas a recibir avisos del torneo en este dispositivo.");
    } catch (e) {
      setState("error");
      setMsg(e.message || "No se pudieron activar las notificaciones.");
    }
  };

  return (
    <div className="card space-y-3 p-4">
      <div>
        <p className="font-semibold text-ink">Notificaciones</p>
        <p className="text-sm text-muted">
          Recibí avisos cuando empiezan los partidos o hay resultados.
        </p>
      </div>

      {state === "on" ? (
        <div className="rounded-xl bg-court/5 px-3 py-2 text-sm font-medium text-court">
          ✓ Notificaciones activadas en este dispositivo.
        </div>
      ) : (
        <button onClick={enable} disabled={state === "loading"} className="btn-primary w-full">
          {state === "loading" ? "Activando…" : "Activar notificaciones"}
        </button>
      )}

      {msg && (
        <p className={`text-sm ${state === "error" ? "text-coral" : "text-muted"}`}>{msg}</p>
      )}
      <p className="text-xs text-muted">
        En iPhone primero instalá la app en la pantalla de inicio; recién ahí Safari permite notificaciones.
      </p>
    </div>
  );
}
