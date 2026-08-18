"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { watchNews, createNews, updateNews } from "@/lib/data";
import { uploadImage } from "@/lib/storage";
import { useAuth } from "@/context/AuthContext";
import { Spinner, Empty } from "@/components/ui";

export default function NewsPage() {
  const { isAdmin } = useAuth();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const unsub = watchNews((n) => { setNews(n); setLoading(false); }, 50);
    return () => unsub();
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="h-display text-3xl">Noticias</h1>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
            <span className="mi" style={{ fontSize: 20 }}>{showForm ? "close" : "add"}</span>
            {showForm ? "Cerrar" : "Noticia"}
          </button>
        )}
      </div>

      {isAdmin && showForm && <NewsForm onDone={() => setShowForm(false)} />}

      {news.length === 0 ? (
        <Empty title="Sin noticias todavía" hint={isAdmin ? "Publicá la primera con + Noticia." : "El administrador aún no publicó novedades."} />
      ) : (
        <div className="space-y-3">
          {news.map((n) => (
            <Link key={n.id} href={`/noticias/${n.id}`} className="card block overflow-hidden">
              {n.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={n.imageUrl} alt="" className="aspect-[2/1] w-full object-cover" />
              )}
              <div className="p-4">
                <p className="h-display text-lg leading-snug">{n.title}</p>
                {n.body && <p className="mt-1 line-clamp-2 text-sm text-muted">{n.body}</p>}
                <p className="mt-2 text-xs text-muted">{fmtDate(n.createdAt)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function fmtDate(ts) {
  try {
    const d = ts?.toDate ? ts.toDate() : ts ? new Date(ts) : null;
    return d ? d.toLocaleDateString("es", { day: "2-digit", month: "long", year: "numeric" }) : "";
  } catch { return ""; }
}

export function NewsForm({ existing, onDone }) {
  const [title, setTitle] = useState(existing?.title || "");
  const [body, setBody] = useState(existing?.body || "");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(existing?.imageUrl || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const pick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    setError("");
    if (!title.trim()) return setError("Poné un título.");
    setSaving(true);
    try {
      let id = existing?.id;
      const data = { title: title.trim(), body: body.trim() };
      if (id) await updateNews(id, data);
      else { const ref = await createNews(data); id = ref.id; }
      if (file) {
        const { url, path } = await uploadImage(file, `news/${id}/cover.jpg`);
        await updateNews(id, { imageUrl: url, imagePath: path });
      }
      onDone();
    } catch (e) {
      setError(e.message || "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card space-y-3 p-4">
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-muted">Título</span>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="La final será el sábado" />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-semibold text-muted">Contenido</span>
        <textarea className="input min-h-[110px]" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Escribí la noticia…" />
      </label>
      <div>
        <span className="mb-1 block text-xs font-semibold text-muted">Imagen de portada</span>
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-24 items-center justify-center overflow-hidden rounded-lg border border-line bg-surface">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="h-full w-full object-cover" />
            ) : <span className="mi text-muted" style={{ fontSize: 24 }}>image</span>}
          </div>
          <label className="btn-ghost cursor-pointer">
            Elegir imagen
            <input type="file" accept="image/*" className="hidden" onChange={pick} />
          </label>
        </div>
      </div>
      {error && <p className="text-sm text-coral">{error}</p>}
      <div className="flex gap-2">
        <button className="btn-primary" disabled={saving} onClick={submit}>{saving ? "Publicando…" : "Publicar"}</button>
        <button className="btn-ghost" onClick={onDone}>Cancelar</button>
      </div>
    </div>
  );
}
