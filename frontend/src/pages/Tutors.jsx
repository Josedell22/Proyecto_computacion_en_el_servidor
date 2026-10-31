import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { Clock, Search, Star, Users } from "lucide-react";

export default function Tutors() {
  const [params, setParams] = useSearchParams();
  const [subjects, setSubjects] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [error, setError] = useState("");
  const subjectId = params.get("subjectId") || "";
  const available = params.get("available") === "1";

  useEffect(() => {
    api("/api/subjects").then((d) => setSubjects(d.subjects));
  }, []);

  useEffect(() => {
    const qs = new URLSearchParams();
    if (subjectId) qs.set("subjectId", subjectId);
    if (available) qs.set("available", "1");
    api(`/api/tutors?${qs.toString()}`)
      .then((d) => setTutors(d.tutors))
      .catch((err) => setError(err.message));
  }, [subjectId, available]);

  function updateFilter(next) {
    const merged = { subjectId, available: available ? "1" : "", ...next };
    const qs = {};
    if (merged.subjectId) qs.subjectId = merged.subjectId;
    if (merged.available) qs.available = merged.available;
    setParams(qs);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Encuentra tu guía</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Estudiantes disponibles</h1>
        <p className="mt-2 text-slate-600">
          Consulta perfiles académicos, horarios y valoraciones. Filtra por materia si buscas un asesor específico.
        </p>
      </div>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      <div className="flex max-w-3xl flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
          <select
            className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            value={subjectId}
            onChange={(e) => updateFilter({ subjectId: e.target.value })}
          >
            <option value="">Todas las materias</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={available}
            onChange={(e) => updateFilter({ available: e.target.checked ? "1" : "" })}
          />
          Con horario publicado
        </label>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tutors.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 md:col-span-2 lg:col-span-3">
            <Users className="mx-auto mb-3 text-slate-400" size={30} />
            No hay estudiantes disponibles con esos filtros.
          </div>
        )}
        {tutors.map((t) => (
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg" key={t.id}>
            <div className="flex items-start justify-between">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-700">
                {t.name?.charAt(0)?.toUpperCase()}
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                {t.slot_count > 0 ? "Con horario" : "Sin horario"}
              </span>
            </div>
            <h2 className="mt-5 text-lg font-bold text-slate-900">{t.name}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {t.program || "Programa no indicado"} · Semestre {t.semester || "N/D"}
            </p>
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{t.bio || "Sin descripción académica."}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(t.subjects || []).map((s) => (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600" key={s.id}>
                  {s.name}
                </span>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-1 text-amber-500">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} fill={star <= Math.round(t.avg_rating) ? "currentColor" : "none"} size={17} />
              ))}
              <span className="ml-1 text-sm font-semibold text-slate-600">
                {Number(t.avg_rating).toFixed(1)} ({t.rating_count})
              </span>
            </div>
            {t.slot_count > 0 && (
              <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500">
                <Clock size={14} /> {t.slot_count} franja{t.slot_count === 1 ? "" : "s"} de disponibilidad
              </p>
            )}
            <Link
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-700"
              to={`/asesores/${t.id}${subjectId ? `?subjectId=${subjectId}` : ""}`}
            >
              Ver perfil académico
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
