import { useEffect, useState } from "react";
import { api, formatDate, STATUS_LABEL } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Check, FileText, Plus, X } from "lucide-react";

export default function Requests() {
  const { user } = useAuth();
  const [tab, setTab] = useState("sent");
  const [subjects, setSubjects] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ subjectId: "", description: "", preferredAt: "" });
  const [error, setError] = useState("");
  const [fields, setFields] = useState({});
  const [showForm, setShowForm] = useState(false);

  async function load(scope = tab) {
    const data = await api(`/api/requests?scope=${scope === "sent" ? "mine" : scope}`);
    setRequests(data.requests);
  }

  useEffect(() => {
    api("/api/subjects").then((d) => setSubjects(d.subjects)).catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    load(tab).catch((err) => setError(err.message));
  }, [tab]);

  async function create(e) {
    e.preventDefault();
    setError("");
    setFields({});
    try {
      await api("/api/requests", {
        method: "POST",
        body: JSON.stringify({
          subjectId: Number(form.subjectId),
          description: form.description,
          preferredAt: form.preferredAt || null,
        }),
      });
      setForm({ subjectId: "", description: "", preferredAt: "" });
      setShowForm(false);
      setTab("sent");
      await load("sent");
    } catch (err) {
      setError(err.message);
      setFields(err.data?.fields || {});
    }
  }

  async function act(id, action) {
    setError("");
    try {
      await api(`/api/requests/${id}/${action}`, { method: "PATCH" });
      await load(tab);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Conecta y aprende</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Solicitudes</h1>
          <p className="mt-2 text-slate-600">Encuentra apoyo académico o publica lo que necesitas reforzar.</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-700" onClick={() => setShowForm((open) => !open)} type="button">
          {showForm ? <X size={18} /> : <Plus size={18} />} {showForm ? "Cerrar formulario" : "Nueva solicitud"}
        </button>
      </div>
      {error && <div className="alert">{error}</div>}
      {showForm && <form className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={create}>
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><FileText size={20} /></span>
          <div><h2 className="text-lg font-bold text-slate-900">Publicar solicitud de ayuda</h2><p className="text-sm text-slate-500">Cuéntale a la comunidad cómo pueden ayudarte.</p></div>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
        <div><label className="mb-2 block text-sm font-semibold text-slate-700">Materia</label><select className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
            <option value="">Seleccione</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {fields.subjectId && <small className="mt-1 block text-sm text-rose-600">{fields.subjectId}</small>}
        </div>
        <div><label className="mb-2 block text-sm font-semibold text-slate-700">Fecha y horario preferido</label><input className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" type="datetime-local" value={form.preferredAt} onChange={(e) => setForm({ ...form, preferredAt: e.target.value })} /></div>
        <div className="md:col-span-2"><label className="mb-2 block text-sm font-semibold text-slate-700">Tema que necesita reforzar</label><textarea className="min-h-28 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          {fields.description && <small className="mt-1 block text-sm text-rose-600">{fields.description}</small>}
        </div>
        </div>
        <button className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white hover:bg-indigo-700" type="submit"><Plus size={17} /> Publicar solicitud</button>
      </form>}
      <div className="flex w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 sm:w-fit">
        <button className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === "sent" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`} onClick={() => setTab("sent")} type="button">Enviadas</button>
        <button className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === "received" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`} onClick={() => setTab("received")} type="button">Recibidas</button>
        <button className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === "open" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`} onClick={() => setTab("open")} type="button">Abiertas</button>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {requests.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 md:col-span-2">No hay solicitudes en esta vista.</div>}
        {requests.map((r) => (
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={r.id}>
            <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-indigo-600">{r.subject_name}</p><h2 className="mt-1 text-lg font-bold text-slate-900">Solicitud de apoyo</h2></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${r.status === "pending" ? "bg-amber-50 text-amber-700" : r.status === "accepted" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{STATUS_LABEL[r.status]}</span></div>
            <p className="mt-4 leading-6 text-slate-700">{r.description}</p>
            <p className="mt-4 text-sm text-slate-500">Solicitante: {r.student_name} {r.advisor_name ? `· Asesor: ${r.advisor_name}` : ""}</p>
            <p className="mt-1 text-sm text-slate-500">Preferida: {formatDate(r.preferred_at)}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {tab === "sent" && r.status === "pending" && r.student_id === user.id && (
                <button className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-100" onClick={() => act(r.id, "cancel")} type="button">Cancelar</button>
              )}
              {(tab === "received" || tab === "open") && r.status === "pending" && r.student_id !== user.id && (
                <>
                  <button className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700" onClick={() => act(r.id, "accept")} type="button"><Check size={15} /> Aceptar</button>
                  {r.advisor_id === user.id && (
                    <button className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200" onClick={() => act(r.id, "reject")} type="button">Rechazar</button>
                  )}
                </>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
