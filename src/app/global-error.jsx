"use client";

export default function GlobalError({ error, reset }) {
  return (
    <html lang="es">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#F5F7FB", margin: 0 }}>
        <div style={{ maxWidth: 420, margin: "60px auto", padding: 24, background: "#fff", borderRadius: 16, textAlign: "center", boxShadow: "0 8px 24px -12px rgba(14,23,38,0.18)" }}>
          <h1 style={{ fontSize: 18, margin: "0 0 8px" }}>La app no pudo cargar</h1>
          <p style={{ fontSize: 14, color: "#5B6675", margin: "0 0 12px" }}>
            Suele deberse a que faltan las variables de entorno de Firebase en Vercel.
            Cargalas en Settings → Environment Variables y volvé a desplegar.
          </p>
          {error?.message ? (
            <pre style={{ background: "#F5F7FB", padding: 12, borderRadius: 8, fontSize: 12, color: "#FF5A5F", textAlign: "left", overflow: "auto" }}>
              {error.message}
            </pre>
          ) : null}
          <button onClick={() => reset()} style={{ background: "#1B4FD1", color: "#fff", border: 0, borderRadius: 12, padding: "10px 16px", fontWeight: 600, cursor: "pointer" }}>
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
