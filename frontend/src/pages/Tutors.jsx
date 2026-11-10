import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { Clock, Search, Star, Users } from "lucide-react";
import { Empty, Notice, PageHeading } from "../components/AcademicUI";
import BrandLoader from "../components/BrandLoader";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";

export default function Tutors() {
  const [params, setParams] = useSearchParams();
  const [subjects, setSubjects] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const subjectId = params.get("subjectId") || "";
  const available = params.get("available") === "1";

  useEffect(() => {
    api("/api/subjects").then((d) => setSubjects(d.subjects));
  }, []);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (subjectId) qs.set("subjectId", subjectId);
    if (available) qs.set("available", "1");
    api(`/api/tutors?${qs.toString()}`)
      .then((d) => { setTutors(d.tutors); setError(""); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [subjectId, available]);

  function updateFilter(next) {
    const merged = { subjectId, available: available ? "1" : "", ...next };
    const qs = {};
    if (merged.subjectId) qs.subjectId = merged.subjectId;
    if (merged.available) qs.available = merged.available;
    setParams(qs);
  }

  const subjectOptions = [
    { value: "", label: "Todas las materias" },
    ...subjects.map((s) => ({ value: String(s.id), label: s.name })),
  ];

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Encuentra tu guía"
        title="Estudiantes disponibles"
        description="Consulta perfiles académicos, horarios y valoraciones. Filtra por materia si buscas un asesor específico."
      />
      <Notice error={error} />
      <div className="flex max-w-3xl flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
          <Select
            className="pl-10"
            value={subjectId}
            onChange={(e) => updateFilter({ subjectId: e.target.value })}
            options={subjectOptions}
            placeholder={null}
          />
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            checked={available}
            onChange={(e) => updateFilter({ available: e.target.checked ? "1" : "" })}
          />
          Con horario publicado
        </label>
      </div>
      {loading ? (
        <BrandLoader variant="inline" message="Buscando asesores..." />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tutors.length === 0 && (
            <Empty icon={Users} title="No hay estudiantes disponibles con esos filtros">
              Prueba con otra materia o quita el filtro de horario.
            </Empty>
          )}
          {tutors.map((t) => (
            <Card key={t.id} hover>
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
