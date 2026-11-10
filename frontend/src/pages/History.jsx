import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { History as HistoryIcon, RotateCcw, Star } from "lucide-react";
import { formatDate, STATUS_LABEL } from "../api/client";
import { useResource } from "../hooks/useResource";
import { Empty, Loading, Notice, PageHeading } from "../components/AcademicUI";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Field from "../components/ui/Field";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";

const EMPTY = { role: "", status: "", subjectId: "", dateFrom: "", dateTo: "" };

function Rating({ item }) {
  if (item.rated) return <span className="inline-flex items-center gap-1 font-semibold text-amber-700">{item.stars}<Star fill="currentColor" size={14} /><span className="sr-only">de 5 estrellas</span></span>;
  if (item.session_id && item.status === "finished") return <Link className="text-sm font-semibold text-indigo-600 hover:underline" to={"/sesiones#sesion-" + item.session_id}>{item.participation_role === "student" ? "Valorar sesión" : "Sin valorar"}</Link>;
  return <span className="text-slate-400">—</span>;
}

export default function History() {
  const [filters, setFilters] = useState(EMPTY);
  const [subjects, setSubjects] = useState([]);
  const qs = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
  const resource = useResource("/api/history?" + qs.toString());

  useEffect(() => {
    if (resource.data?.subjects) setSubjects(resource.data.subjects);
  }, [resource.data]);

  const items = resource.data?.history || [];
  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  const roleOptions = [
    { value: "", label: "Todos los roles" },
    { value: "student", label: "Como solicitante" },
    { value: "advisor", label: "Como asesor" },
  ];

  const statusOptions = [
    { value: "", label: "Todos los estados" },
    ...Object.entries(STATUS_LABEL)
      .filter(([key]) => key !== "confirmed")
      .map(([key, label]) => ({ value: key, label })),
  ];

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Tu recorrido académico"
        title="Historial de asesorías"
        description="Revisa tus solicitudes y sesiones, consulta sus resultados y encuentra las valoraciones pendientes."
      />
      <Card aria-label="Filtros del historial">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Participación" htmlFor="history-role">
            <Select
              id="history-role"
              value={filters.role}
              onChange={(e) => update("role", e.target.value)}
              options={roleOptions}
              placeholder={null}
            />
          </Field>
          <Field label="Estado" htmlFor="history-status">
            <Select
              id="history-status"
              value={filters.status}
              onChange={(e) => update("status", e.target.value)}
              options={statusOptions}
              placeholder={null}
            />
          </Field>
          <Field label="Materia" htmlFor="history-subject">
            <Select
              id="history-subject"
              value={filters.subjectId}
              onChange={(e) => update("subjectId", e.target.value)}
              options={[{ value: "", label: "Todas las materias" }, ...subjects.map((s) => ({ value: String(s.id), label: s.name }))]}
              placeholder={null}
            />
          </Field>
          <Field label="Desde" htmlFor="history-from">
            <Input
              id="history-from"
              type="date"
              value={filters.dateFrom}
              max={filters.dateTo || undefined}
              onChange={(e) => update("dateFrom", e.target.value)}
            />
          </Field>
          <Field label="Hasta" htmlFor="history-to">
            <Input
              id="history-to"
              type="date"
              value={filters.dateTo}
              min={filters.dateFrom || undefined}
              onChange={(e) => update("dateTo", e.target.value)}
            />
          </Field>
          <div className="flex items-end">
            <Button variant="secondary" onClick={() => setFilters(EMPTY)} type="button">
              <RotateCcw size={15} /> Limpiar filtros
            </Button>
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Las fechas filtran el día de la sesión o la fecha preferida de la solicitud, en hora de Colombia (UTC−5).
        </p>
      </Card>
      <Notice error={resource.error} retry={resource.reload} />
      {resource.loading ? (
        <Loading />
      ) : (
        !resource.error &&
        (items.length === 0 ? (
          <Empty icon={HistoryIcon} title="No encontramos resultados">
            Prueba con otros filtros o inicia tu primera asesoría desde Solicitudes.
          </Empty>
        ) : (
          <>
            <p className="text-sm text-slate-500" role="status">
              {items.length} {items.length === 1 ? "registro encontrado" : "registros encontrados"}
            </p>
            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
              <table className="w-full">
                <caption className="sr-only">Solicitudes y sesiones del historial</caption>
                <thead className="bg-slate-100/70">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Materia y fecha</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Participación</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Participantes</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Estado</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Valoración</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="max-w-xs px-4 py-5">
                        <p className="break-words font-semibold text-slate-900">{item.subject_name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(item.scheduled_at || item.preferred_at || item.created_at)}
                        </p>
                        {item.session_id && (
                          <Link className="mt-2 inline-block text-xs font-semibold text-indigo-600" to={"/sesiones#sesion-" + item.session_id}>
                            Ver sesión
                          </Link>
                        )}
                      </td>
                      <td className="px-4 py-5">{item.participation_role === "student" ? "Solicitante" : "Asesor"}</td>
                      <td className="max-w-52 break-words px-4 py-5">
                        <p>{item.student_name}</p>
                        <p className="mt-1 text-xs text-slate-500">Asesor: {item.advisor_name || "Sin asignar"}</p>
                      </td>
                      <td className="px-4 py-5">
                        <Badge status={item.status}>{STATUS_LABEL[item.status]}</Badge>
                      </td>
                      <td className="px-4 py-5"><Rating item={item} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-4 md:hidden">
              {items.map((item) => (
                <Card key={item.id}>
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="min-w-0 break-words font-bold text-slate-900">{item.subject_name}</h2>
                    <Badge status={item.status}>{STATUS_LABEL[item.status]}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {formatDate(item.scheduled_at || item.preferred_at || item.created_at)}
                  </p>
                  <dl className="mt-4 space-y-2 text-sm">
                    <div><dt className="inline text-slate-500">Tu participación: </dt><dd className="inline">{item.participation_role === "student" ? "Solicitante" : "Asesor"}</dd></div>
                    <div><dt className="inline text-slate-500">Solicitante: </dt><dd className="inline">{item.student_name}</dd></div>
                    <div><dt className="inline text-slate-500">Asesor: </dt><dd className="inline">{item.advisor_name || "Sin asignar"}</dd></div>
                  </dl>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                    <Rating item={item} />
                    {item.session_id && (
                      <Link className="text-sm font-semibold text-indigo-600" to={"/sesiones#sesion-" + item.session_id}>
                        Ver sesión
                      </Link>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </>
        ))
      )}
    </div>
  );
}
