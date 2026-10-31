import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatDate } from "../api/client";
import { AlertTriangle, Download, File, FileImage, FileText, Search } from "lucide-react";

function FileIcon({ name }) {
  const extension = name?.split(".").pop()?.toLowerCase();
  if (["png", "jpg", "jpeg"].includes(extension)) return <FileImage size={23} />;
  if (["pdf", "doc", "docx"].includes(extension)) return <FileText size={23} />;
  return <File size={23} />;
}

export default function Publications() {
  const [items, setItems] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [q, setQ] = useState("");
  const [subjectId, setSubjectId] = useState("");

  async function load(term = q, subject = subjectId) {
    const qs = new URLSearchParams();
    if (term) qs.set("q", term);
    if (subject) qs.set("subjectId", subject);
    const data = await api(`/api/publications?${qs.toString()}`);
    setItems(data.publications);
  }

  useEffect(() => {
    api("/api/subjects").then((d) => setSubjects(d.subjects));
    load("", "").catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Comparte conocimiento</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Publicaciones</h1><p className="mt-2 text-slate-600">Encuentra guías y apuntes compartidos por la comunidad.</p></div>
        <Link className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-sm hover:bg-indigo-700" to="/publicaciones/nueva">+ Nueva publicación</Link>
      </div>
      <form className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row" onSubmit={(e) => { e.preventDefault(); load(); }}>
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={19} /><input className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" placeholder="Buscar por título o materia" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          <option value="">Todas</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button className="rounded-xl bg-slate-100 px-5 py-2.5 font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600" type="submit">Buscar</button>
      </form>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {items.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 md:col-span-2 lg:col-span-3">No hay publicaciones disponibles.</div>}
        {items.map((p) => (
          <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md" key={p.id}>
            <div className="flex items-start justify-between gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><FileIcon name={p.original_name} /></span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">Máx. 5 MB</span></div>
            <h2 className="mt-5 text-lg font-bold text-slate-900">{p.title}</h2>
            <p className="mt-1 text-sm text-indigo-600">{p.subject_name}</p>
            <p className="mt-3 line-clamp-3 leading-6 text-slate-600">{p.description}</p>
            <p className="mt-4 text-xs text-slate-500">Por {p.author_name} · {formatDate(p.created_at)}</p>
            {p.original_name && <p className="mt-2 truncate text-xs text-slate-500">Archivo: {p.original_name}</p>}
            <div className="mt-auto flex flex-wrap gap-2 pt-5">
              <Link className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700" to={`/publicaciones/${p.id}`}>Ver detalle</Link>
              {p.fileUrl && <a className="inline-flex items-center justify-center rounded-lg bg-emerald-50 px-3 py-2 text-emerald-700 hover:bg-emerald-100" href={p.fileUrl} target="_blank" rel="noreferrer" download aria-label="Descargar archivo"><Download size={17} /></a>}
              <Link className="inline-flex items-center justify-center rounded-lg bg-amber-50 px-3 py-2 text-amber-700 hover:bg-amber-100" to={`/publicaciones/${p.id}`} aria-label="Reportar publicación"><AlertTriangle size={17} /></Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
