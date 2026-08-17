export function PageHeader({ eyebrow, title, action }) {
  return (
    <header className="mb-4 flex items-end justify-between gap-3">
      <div>
        {eyebrow ? <p className="eyebrow mb-1">{eyebrow}</p> : null}
        <h1 className="h-display text-2xl leading-tight sm:text-3xl">{title}</h1>
      </div>
      {action}
    </header>
  );
}

export function Empty({ title, hint }) {
  return (
    <div className="card flex flex-col items-center gap-1 px-6 py-12 text-center">
      <span className="mi mb-1 text-muted" style={{ fontSize: 40 }}>sports_volleyball</span>
      <p className="h-display text-lg">{title}</p>
      {hint ? <p className="max-w-sm text-sm text-muted">{hint}</p> : null}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-court" />
    </div>
  );
}

export function LiveBadge() {
  return (
    <span className="live-badge">
      <span className="live-dot" /> En vivo
    </span>
  );
}
