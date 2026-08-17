"use client";

import { useEffect } from "react";
import { registerMessagingSW, listenForeground } from "@/lib/messaging";

export default function RegisterSW() {
  useEffect(() => {
    // Registra el service worker (habilita instalación PWA y prepara FCM).
    registerMessagingSW();

    // Muestra notificaciones cuando la app está abierta.
    let unsub = () => {};
    listenForeground((payload) => {
      const n = payload?.notification;
      if (n && typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification(n.title || "Torneo Voley", {
          body: n.body || "",
          icon: "/icons/icon-192.png",
        });
      }
    }).then((fn) => (unsub = fn || (() => {})));

    return () => unsub();
  }, []);

  return null;
}
