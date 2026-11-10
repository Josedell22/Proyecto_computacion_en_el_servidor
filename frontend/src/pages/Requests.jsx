import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, ClipboardList, Plus, RefreshCw, X } from "lucide-react";
import { api, currentLocalDateTimeInput, formatDate, STATUS_LABEL, toApiDateTime, toLocalDateTimeInput } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useResource } from "../hooks/useResource";
import { ConfirmDialog, Empty, Loading, Notice, PageHeading } from "../components/AcademicUI";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Field from "../components/ui/Field";
import Input from "../components/ui/Input";
import SubjectSelect from "../components/ui/SubjectSelect";
import Textarea from "../components/ui/Textarea";

const blank = { subjectId: "", description: "", preferredAt: "" };
const tabs = [["mine", "Enviadas"], ["received", "Recibidas"], ["open", "Abiertas de mis materias"]];

export default function Requests() {
  const { user } = useAuth();
  const [tab, setTab] = useState("mine");
  const resource = useResource("/api/requests?scope=" + tab);
  const subjects = useResource("/api/subjects");
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const [fields, setFields] = useState({});
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [scheduledAt, setScheduledAt] = useState("");

  async function create(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(""); setFields({}); setMessage("");
    try {
      await api("/api/requests", { method: "POST", body: JSON.stringify({ ...form, subjectId: Number(form.subjectId), preferredAt: toApiDateTime(form.preferredAt) }) });
      setForm(blank); setShowForm(false); setTab("mine"); resource.reload();
      setMessage("Solicitud publicada. Los asesores de esta materia podrán responder.");
    } catch (err) { setError(err.message); setFields(err.data?.fields || {}); }
    finally { setBusy(false); }
  }

  function confirm(request, action) {
    setError(""); setMessage("");
    setScheduledAt(request.preferred_at && new Date(request.preferred_at) > new Date() ? toLocalDateTimeInput(request.preferred_at) : "");
    setConfirmation({ request, action });
  }

  async function act() {
    if (busy || !confirmation) return;
    if (confirmation.action === "accept" && (!scheduledAt || new Date(toApiDateTime(scheduledAt)) <= new Date())) {
      setError("Seleccione una fecha y hora futura."); return;
    }
    setBusy(true); setError("");
    try {
      const { request, action } = confirmation;
      await api("/api/requests/" + request.id + "/" + action, {
        method: "PATCH",
        body: JSON.stringify(action === "accept" ? { scheduledAt: toApiDateTime(scheduledAt) } : {}),
      });
      setMessage(action === "accept" ? "Solicitud aceptada. Puedes consultar la sesión en Sesiones." : action === "cancel" ? "Solicitud cancelada." : "Solicitud rechazada.");
      setConfirmation(null); resource.reload();
    } catch (err) { setError(err.message); if (err.status === 409) resource.reload(); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-6">
      <PageHeading eyebrow="Conecta y aprende" title="Solicitudes" description="Pide apoyo a la comunidad o responde a estudiantes que necesitan tus conocimientos.">
        <Button className="shrink-0" onClick={() => { setShowForm(!showForm); setError(""); }} disabled={busy} type="button">
          {showForm ? <><X size={17} /> Cerrar formulario</> : <><Plus size={17} /> Nueva solicitud</>}
        </Button>
      </PageHeading>
      <Notice error={!confirmation && (error || resource.error || subjects.error)} message={message} retry={resource.error ? resource.reload : undefined} />
      {showForm && (
        <Card>
          <form onSubmit={create}>
            <h2 className="text-lg font-bold text-slate-900">Publicar solicitud de ayuda</h2>
            <p className="mt-1 text-xs text-slate-500">Fecha y hora de Colombia (UTC−5).</p>
            <p className="mt-1 text-sm text-slate-500">Para contactar a alguien en particular, visita su <Link className="font-semibold text-indigo-600 underline" to="/asesores">perfil de asesor</Link>.</p>
            <fieldset disabled={busy} className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              <SubjectSelect
                subjects={subjects.data?.subjects || []}
                value={form.subjectId}
                onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                required
                label="Materia"
                placeholder={subjects.loading ? "Cargando..." : "Seleccione una materia"}
                error={fields.subjectId}
              />
              <Field label="Fecha y hora preferida" htmlFor="request-date" error={fields.preferredAt}>
                <Input
                  id="request-date"
                  type="datetime-local"
                  min={currentLocalDateTimeInput()}
                  required
                  value={form.preferredAt}
                  onChange={(e) => setForm({ ...form, preferredAt: e.target.value })}
                />
              </Field>
              <Field label="Tema que necesitas reforzar" htmlFor="request-description" error={fields.description} className="md:col-span-2">
                <Textarea
                  id="request-description"
                  placeholder="Por ejemplo: necesito practicar operaciones con matrices..."
                  required
                  maxLength={1200}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                />
              </Field>
              <Button type="submit" className="w-fit" loading={busy} disabled={subjects.loading}>
                {busy ? "Publicando..." : "Publicar solicitud"}
              </Button>
            </fieldset>
          </form>
        </Card>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex max-w-full flex-wrap gap-1 rounded-xl bg-slate-100 p-1" aria-label="Vistas de solicitudes">
          {tabs.map(([value, label]) => (
            <Button
              key={value}
              type="button"
              variant="ghost"
              aria-pressed={tab === value}
              className={tab === value ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}
              onClick={() => { setTab(value); setError(""); }}
            >
              {label}
            </Button>
          ))}
        </div>
        <Button variant="secondary" onClick={resource.reload} disabled={resource.loading} type="button">
          <RefreshCw size={15} /> Actualizar
        </Button>
      </div>
      {resource.loading ? (
        <Loading />
      ) : (
        !resource.error && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {!resource.data?.requests.length && (
              <Empty icon={ClipboardList} title="Sin solicitudes en esta vista">
                {tab === "mine" ? "Publica una solicitud o busca un asesor para empezar." : tab === "open" ? "Aquí aparecerán las solicitudes abiertas de las materias que registraste en tu perfil." : "Aquí verás las solicitudes dirigidas a ti."}
              </Empty>
            )}
            {resource.data?.requests.map((r) => (
              <Card key={r.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{r.advisor_id ? "Solicitud directa" : "Solicitud abierta"}</p>
                    <h2 className="mt-2 break-words text-lg font-bold text-slate-900">{r.subject_name}</h2>
                  </div>
                  <Badge status={r.status}>{STATUS_LABEL[r.status]}</Badge>
                </div>
                <p className="my-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">{r.description}</p>
                <div className="space-y-1 border-t border-slate-100 pt-4 text-sm text-slate-500">
                  <p>Solicitante: <span className="text-slate-800">{r.student_name}</span></p>
                  {r.advisor_name && <p>Asesor: <span className="text-slate-800">{r.advisor_name}</span></p>}
                  <p>{r.scheduled_at ? "Programada: " : "Preferida: "}{formatDate(r.scheduled_at || r.preferred_at)}</p>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {r.status === "pending" && r.student_id === user.id && (
                    <Button variant="secondary" type="button" onClick={() => confirm(r, "cancel")}>Cancelar solicitud</Button>
                  )}
                  {r.status === "pending" && r.student_id !== user.id && (
                    <>
                      <Button type="button" onClick={() => confirm(r, "accept")}><Check size={16} /> Aceptar</Button>
                      {r.advisor_id === user.id && <Button variant="secondary" type="button" onClick={() => confirm(r, "reject")}>Rechazar</Button>}
                    </>
                  )}
                  {r.session_id && <Button variant="secondary" to={"/sesiones#sesion-" + r.session_id}>Ver sesión</Button>}
                </div>
              </Card>
            ))}
          </div>
        )
      )}
      <ConfirmDialog
        open={!!confirmation}
        busy={busy}
        title={confirmation?.action === "accept" ? "Programar asesoría" : confirmation?.action === "cancel" ? "Cancelar solicitud" : "Rechazar solicitud"}
        confirmLabel={confirmation?.action === "accept" ? "Confirmar y crear sesión" : "Confirmar"}
        onClose={() => { setConfirmation(null); setError(""); }}
        onConfirm={act}
      >
        <p>{confirmation?.request.subject_name} · {confirmation?.request.student_name}</p>
        {confirmation?.action === "accept" ? (
          <>
            <Field label="Fecha y hora de la sesión" htmlFor="session-date">
              <Input
                id="session-date"
                type="datetime-local"
                min={currentLocalDateTimeInput()}
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </Field>
            <p className="text-sm text-slate-500">Hora de Colombia (UTC−5). Confirma la fecha preferida o el horario que acordaste con el solicitante.</p>
          </>
        ) : (
          <p>La solicitud dejará de estar pendiente. Esta acción no se puede deshacer.</p>
        )}
        <Notice error={error} />
      </ConfirmDialog>
    </div>
  );
}
