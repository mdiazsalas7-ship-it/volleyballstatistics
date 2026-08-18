"use client";

import { useEffect, useState } from "react";
import AdminGuard from "@/components/AdminGuard";
import { PageHeader, Spinner, Empty } from "@/components/ui";
import { getTeams, watchMatches } from "@/lib/data";
import Annotator from "@/components/Annotator";

export default function MesaTecnicaPage() {
  return (
    <AdminGuard>
      <MesaTecnica />
    </AdminGuard>
  );
}

function MesaTecnica() {
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getTeams().then(setTeams);
    const unsub = watchMatches((m) => {
      setMatches(m);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <Spinner />;

  if (selected) {
    const match = matches.find((m) => m.id === selected);
    if (!match) {
      setSelected(null);
      return null;
    }
    return <Annotator match={match} teams={teams} onBack={() => setSelected(null)} />;
  }

  const teamName = (id) => teams.find((t) => t.id === id)?.name || "—";
  const openable = matches.filter((m) => m.status !== "finished");

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Solo admin" title="Mesa técnica" />
      <p className="px-1 text-sm text-muted">Elegí un partido para anotar el marcador y las estadísticas.</p>

      {openable.length === 0 ? (
        <Empty title="No hay partidos por anotar" hint="Programá partidos desde el Calendario." />
      ) : (
        <div className="space-y-2">
          {openable.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelected(m.id)}
              className="card flex w-full items-center justify-between px-4 py-3 text-left hover:bg-surface"
            >
              <div>
                <p className="font-semibold text-snow">
                  {teamName(m.homeTeamId)} <span className="text-muted">vs</span> {teamName(m.awayTeamId)}
                </p>
                <p className="text-xs text-muted">
                  {m.status === "live" ? "En vivo" : "Programado"}
                  {m.date ? ` · ${new Date(m.date).toLocaleString("es", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}` : ""}
                </p>
              </div>
              <span className="text-court">→</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
