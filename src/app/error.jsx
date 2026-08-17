"use client";

export default function Error({ error, reset }) {
  return (
    <div className="card mx-auto mt-10 max-w-md space-y-3 p-6 text-center">
      <p className="h-display text-lg">Algo salió mal</p>
      <p className="text-sm text-muted">
        Ocurrió un error al cargar esta sección. Probá recargar; si sigue, revisá
        la configuración de Firebase.
      </p>
      {error?.message ? (
        <pre className="overflow-auto rounded-lg bg-surface p-3 text-left text-xs text-coral">
          {error.message}
        </pre>
      ) : null}
      <button onClick={() => reset()} className="btn-primary">Reintentar</button>
    </div>
  );
}
