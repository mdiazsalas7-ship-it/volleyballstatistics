"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getNewsItem, deleteNews } from "@/lib/data";
import { useAuth } from "@/context/AuthContext";
import { Spinner } from "@/components/ui";
import { NewsForm } from "../page";

export default function NewsDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [item, setItem] = useState(undefined);
  const [editing, setEditing] = useState(false);

  const load = async () => setItem(await getNewsItem(id));
  useEffect(() => { load(); }, [id]);

  if (item === undefined) return <Spinner />;
  if (item === null) return <p className="card px-6 py-12 text-center">Noticia no encontrada.</p>;

  const fmt = (ts) => {
    try {
      const d = ts?.toDate ? ts.toDate() : ts ? new Date(ts) : null;
      return d ? d.toLocaleDateString("es", { day: "2-digit", month: "long", year: "numeric" }) : "";
    } catch { return ""; }
  };

  const remove = async () => {
    if (!confirm("¿Eliminar esta noticia?")) return;
    await deleteNews(id);
    router.push("/noticias");
  };

  if (editing) {
    return (
      <div className="space-y-4">
        <h1 className="h-display text-2xl">Editar noticia</h1>
        <NewsForm existing={item} onDone={async () => { setEditing(false); await load(); }} />
      </div>
    );
  }

  return (
    <article className="space-y-4">
      <button onClick={() => router.push("/noticias")} className="flex items-center gap-1 text-sm font-semibold text-muted">
        <span className="mi" style={{ fontSize: 20 }}>arrow_back</span> Noticias
      </button>

      {item.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt="" className="w-full rounded-2xl object-cover" />
      )}
      <h1 className="h-display text-2xl leading-tight">{item.title}</h1>
      <p className="text-xs text-muted">{fmt(item.createdAt)}</p>
      {item.body && <p className="whitespace-pre-wrap leading-relaxed text-snow">{item.body}</p>}

      {isAdmin && (
        <div className="flex gap-2 pt-2">
          <button onClick={() => setEditing(true)} className="btn-ghost flex-1">Editar</button>
          <button onClick={remove} className="btn-ghost flex-1 border-coral/40 text-coral">Eliminar</button>
        </div>
      )}
    </article>
  );
}
