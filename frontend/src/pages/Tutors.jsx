import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { Search, Star, Users } from "lucide-react";

export default function Tutors() {
  const [params, setParams] = useSearchParams();
  const [subjects, setSubjects] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [error, setError] = useState("");
  const subjectId = params.get("subjectId") || "";

  useEffect(() => {
    api("/api/subjects").then((d) => setSubjects(d.subjects));
  }, []);

  useEffect(() => {
    if (!subjectId) {
      setTutors([]);
      return;
    }
    api(`/api/tutors?subjectId=${subjectId}`)
      .then((d) => setTutors(d.tutors))
      .catch((err) => setError(err.message));
  }, [subjectId]);

  return (
    <div className="space-y-6">
      <div><p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Encuentra tu guía</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Asesores</h1><p className="mt-2 text-slate-600">Busca estudiantes disponibles según la materia que necesitas.</p></div>
      {error && <div className="alert">{error}</div>}
      <div className="flex max-w-2xl flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={19} /><select className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={subjectId} onChange={(e) => setParams({ subjectId: e.target.value })}>
          <option value="">Seleccione una materia</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select></div>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {!subjectId && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 md:col-span-2 lg:col-span-3"><Users className="mx-auto mb-3 text-slate-400" size={30} />Selecciona una materia para ver asesores disponibles.</div>}
        {subjectId && tutors.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 md:col-span-2 lg:col-span-3">No hay estudiantes disponibles para esta materia.</div>}
        {tutors.map((t) => (
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg" key={t.id}>
            <div className="flex items-start justify-between"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-700">{t.name?.charAt(0)?.toUpperCase()}</div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Disponible</span></div>
            <h2 className="mt-5 text-lg font-bold text-slate-900">{t.name}</h2>
            <p className="mt-1 text-sm text-slate-500">{t.program} · Semestre {t.semester || "N/D"}</p>
            <div className="mt-4 flex items-center gap-1 text-amber-500">{[1, 2, 3, 4, 5].map((star) => <Star key={star} fill={star <= Math.round(t.avg_rating) ? "currentColor" : "none"} size={17} />)}<span className="ml-1 text-sm font-semibold text-slate-600">{Number(t.avg_rating).toFixed(1)} ({t.rating_count})</span></div>
            <Link className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-700" to={`/asesores/${t.id}?subjectId=${subjectId}`}>Solicitar asesoría</Link>
          </article>
        ))}
      </div>
    </div>
  );
}
