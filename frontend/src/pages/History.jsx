import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { History as HistoryIcon, RotateCcw, Star } from "lucide-react";
import { formatDate, STATUS_LABEL } from "../api/client";
import { useResource } from "../hooks/useResource";
import { Empty, Loading, Notice, PageHeading, panel, secondaryButton } from "../components/AcademicUI";

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
  // Keep filter options while a new request is loading.
  useEffect(() => {
    if (resource.data?.subjects) setSubjects(resource.data.subjects);
  }, [resource.data]);
  const items = resource.data?.history || [];
  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  return <div className="space-y-6">
    <PageHeading eyebrow="Tu recorrido académico" title="Historial de asesorías" description="Revisa tus solicitudes y sesiones, consulta sus resultados y encuentra las valoraciones pendientes." />
    <section className={panel} aria-label="Filtros del historial">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div><label htmlFor="history-role">Participación</label><select id="history-role" value={filters.role} onChange={(e) => update("role", e.target.value)}><option value="">Todos los roles</option><option value="student">Como solicitante</option><option value="advisor">Como asesor</option></select></div>
        <div><label htmlFor="history-status">Estado</label><select id="history-status" value={filters.status} onChange={(e) => update("status", e.target.value)}><option value="">Todos los estados</option>{Object.entries(STATUS_LABEL).filter(([key]) => key !== "confirmed").map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
        <div><label htmlFor="history-subject">Materia</label><select id="history-subject" value={filters.subjectId} onChange={(e) => update("subjectId", e.target.value)}><option value="">Todas las materias</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
        <div><label htmlFor="history-from">Desde</label><input id="history-from" type="date" value={filters.dateFrom} max={filters.dateTo || undefined} onChange={(e) => update("dateFrom", e.target.value)} /></div>
        <div><label htmlFor="history-to">Hasta</label><input id="history-to" type="date" value={filters.dateTo} min={filters.dateFrom || undefined} onChange={(e) => update("dateTo", e.target.value)} /></div>
        <div className="flex items-end"><button className={secondaryButton} onClick={() => setFilters(EMPTY)} type="button"><RotateCcw size={15} />Limpiar filtros</button></div>
      </div>
      <p className="mt-4 text-xs text-slate-500">Las fechas filtran el día de la sesión o la fecha preferida de la solicitud, en hora de Colombia (UTC−5).</p>
    </section>
    <Notice error={resource.error} retry={resource.reload} />
    {resource.loading ? <Loading /> : !resource.error && (items.length === 0 ? <Empty icon={HistoryIcon} title="No encontramos resultados">Prueba con otros filtros o inicia tu primera asesoría desde Solicitudes.</Empty> : <>
      <p className="text-sm text-slate-500" role="status">{items.length} {items.length === 1 ? "registro encontrado" : "registros encontrados"}</p>
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block"><table>
        <caption className="sr-only">Solicitudes y sesiones del historial</caption>
        <thead className="bg-slate-100/70"><tr><th scope="col">Materia y fecha</th><th scope="col">Participación</th><th scope="col">Participantes</th><th scope="col">Estado</th><th scope="col">Valoración</th></tr></thead>
        <tbody>{items.map((item) => <tr key={item.id} className="hover:bg-slate-50">
          <td className="max-w-xs py-5"><p className="break-words font-semibold text-slate-900">{item.subject_name}</p><p className="mt-1 text-xs text-slate-500">{formatDate(item.scheduled_at || item.preferred_at || item.created_at)}</p>{item.session_id && <Link className="mt-2 inline-block text-xs font-semibold text-indigo-600" to={"/sesiones#sesion-" + item.session_id}>Ver sesión</Link>}</td>
          <td>{item.participation_role === "student" ? "Solicitante" : "Asesor"}</td><td className="max-w-52 break-words"><p>{item.student_name}</p><p className="mt-1 text-xs text-slate-500">Asesor: {item.advisor_name || "Sin asignar"}</p></td>
          <td><span className={"badge " + item.status}>{STATUS_LABEL[item.status]}</span></td><td><Rating item={item} /></td>
        </tr>)}</tbody>
      </table></div>
      <div className="space-y-4 md:hidden">{items.map((item) => <article key={item.id} className={panel}>
        <div className="flex items-start justify-between gap-3"><h2 className="min-w-0 break-words font-bold text-slate-900">{item.subject_name}</h2><span className={"badge " + item.status}>{STATUS_LABEL[item.status]}</span></div>
        <p className="mt-2 text-xs text-slate-500">{formatDate(item.scheduled_at || item.preferred_at || item.created_at)}</p>
        <dl className="mt-4 space-y-2 text-sm"><div><dt className="inline text-slate-500">Tu participación: </dt><dd className="inline">{item.participation_role === "student" ? "Solicitante" : "Asesor"}</dd></div><div><dt className="inline text-slate-500">Solicitante: </dt><dd className="inline">{item.student_name}</dd></div><div><dt className="inline text-slate-500">Asesor: </dt><dd className="inline">{item.advisor_name || "Sin asignar"}</dd></div></dl>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4"><Rating item={item} />{item.session_id && <Link className="text-sm font-semibold text-indigo-600" to={"/sesiones#sesion-" + item.session_id}>Ver sesión</Link>}</div>
      </article>)}</div>
    </>)}
  </div>;
}
