"use client";

import { useEffect, useState } from "react";

export default function InstallPWA() {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOS, setShowIOS] = useState(false);

  useEffect(() => {
    const onBIP = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", () => setInstalled(true));

    const ua = window.navigator.userAgent || "";
    const ios = /iphone|ipad|ipod/i.test(ua);
    const standalone =
      window.navigator.standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches;
    setIsIOS(ios);
    setInstalled(standalone);

    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  if (installed) {
    return (
      <div className="card px-4 py-3 text-sm text-muted">
        ✓ La app ya está instalada en este dispositivo.
      </div>
    );
  }

  const install = async () => {
    if (deferred) {
      deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
    } else if (isIOS) {
      setShowIOS(true);
    } else {
      setShowIOS(true); // fallback: mostramos ayuda genérica
    }
  };

  return (
    <div className="card space-y-3 p-4">
      <div>
        <p className="font-semibold text-snow">Instalar en el celular</p>
        <p className="text-sm text-muted">
          Agregá la app a tu pantalla de inicio para abrirla como una app nativa.
        </p>
      </div>
      <button onClick={install} className="btn-primary w-full">
        Instalar app
      </button>

      {showIOS && (
        <div className="rounded-xl border border-line bg-surface p-3 text-sm text-snow">
          {isIOS ? (
            <>
              <p className="mb-1 font-semibold">En iPhone / iPad (Safari):</p>
              <ol className="list-decimal space-y-1 pl-5 text-muted">
                <li>Tocá el botón <b>Compartir</b> (el cuadrito con la flecha ↑).</li>
                <li>Elegí <b>Agregar a inicio</b>.</li>
                <li>Confirmá con <b>Agregar</b>.</li>
              </ol>
            </>
          ) : (
            <>
              <p className="mb-1 font-semibold">Cómo instalar:</p>
              <p className="text-muted">
                Abrí el menú del navegador (⋮) y elegí <b>Instalar app</b> o
                <b> Agregar a pantalla de inicio</b>.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
