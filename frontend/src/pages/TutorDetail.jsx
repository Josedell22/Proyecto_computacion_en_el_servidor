import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api, formatDate, formatTime } from "../api/client";
import { CalendarClock, GraduationCap, MessageSquare, Star } from "lucide-react";

export default function TutorDetail() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ subjectId: params.get("subjectId") || "", description: "", preferredAt: "" });
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    api(`/api/tutors/${id}`).then(setData).catch((err) => setError(err.message));
  }, [id]);

  async function send(e) {
    e.preventDefault();
    setError("");
    try {
      await api("/api/requests", {
        method: "POST",
        body: JSON.stringify({
          advisorId: Number(id),
          subjectId: Number(form.subjectId),
          description: form.description,
          preferredAt: form.preferredAt || null,
        }),
      });
      setOk("Solicitud enviada al asesor.");
      setTimeout(() => navigate("/solicitudes"), 800);
    } catch (err) {
      setError(err.message);
    }
  }

  if (!data && !error) return <p className="text-slate-500">Cargando perfil académico...</p>;
  if (!data) return <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>;

  const { tutor, subjects, availability, ratings } = data;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-700">
              {tutor.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Perfil académico</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{tutor.name}</h1>
              <p className="mt-1 text-slate-500">
                {tutor.program || "Programa no indicado"} · Semestre {tutor.semester || "N/D"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-amber-500">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} fill={star <= Math.round(tutor.avg_rating) ? "currentColor" : "none"} size={18} />
            ))}
            <span className="ml-1 text-sm font-semibold text-slate-600">
              {Number(tutor.avg_rating).toFixed(1)} / 5 ({tutor.rating_count})
            </span>
          </div>
        </div>
        <p className="mt-5 leading-7 text-slate-600">{tutor.bio || "Este estudiante aún no publicó una descripción personal."}</p>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      {ok && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{ok}</div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <GraduationCap size={21} />
              </span>
              <div>
                <h2 className="font-bold text-slate-900">Materias que domina</h2>
                <p className="text-sm text-slate-500">Asignaturas registradas para ofrecer asesoría.</p>
              </div>
            </div>
            {subjects.length === 0 && <p className="text-sm text-slate-500">Sin materias registradas.</p>}
            <div className="flex flex-wrap gap-2">
              {subjects.map((s) => (
                <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700" key={s.id}>
                  {s.name}
                </span>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <CalendarClock size={21} />
              </span>
              <div>
                <h2 className="font-bold text-slate-900">Horarios de disponibilidad</h2>
                <p className="text-sm text-slate-500">Franjas en las que el asesor puede atender.</p>
              </div>
            </div>
            {availability.length === 0 && <p className="text-sm text-slate-500">Sin horarios registrados.</p>}
            <ul className="space-y-2">
              {availability.map((a) => (
                <li className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm" key={a.id}>
                  <span className="font-semibold text-slate-800">{a.weekdayLabel}</span>
                  <span className="text-slate-600">
                    {formatTime(a.start_time)} - {formatTime(a.end_time)}
                  </span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <MessageSquare size={21} />
              </span>
              <div>
                <h2 className="font-bold text-slate-900">Valoraciones</h2>
                <p className="text-sm text-slate-500">Comentarios de estudiantes que ya recibieron asesoría.</p>
              </div>
            </div>
            {ratings.length === 0 && <p className="text-sm text-slate-500">Aún no hay valoraciones para este asesor.</p>}
            <ul className="space-y-3">
              {ratings.map((r) => (
                <li className="rounded-xl border border-slate-100 p-4" key={r.id}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1 text-amber-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} fill={star <= r.stars ? "currentColor" : "none"} size={15} />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400">{formatDate(r.created_at)}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-700">{r.subject_name}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{r.comment || "Sin comentario."}</p>
                </li>
              ))}
            </ul>
          </article>
        </div>

        <form className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-5" onSubmit={send}>
          <h2 className="font-bold text-slate-900">Enviar solicitud de asesoría</h2>
          <p className="mt-1 text-sm text-slate-500">Elige una materia que este estudiante domine.</p>
          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Materia</label>
              <select
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                value={form.subjectId}
                onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                required
              >
                <option value="">Seleccione</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Tema</label>
              <textarea
                className="min-h-28 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Fecha y hora preferida</label>
              <input
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                type="datetime-local"
                value={form.preferredAt}
                onChange={(e) => setForm({ ...form, preferredAt: e.target.value })}
              />
            </div>
          </div>
          <button className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700" type="submit">
            Enviar solicitud
          </button>
        </form>
      </div>
    </div>
  );
}
