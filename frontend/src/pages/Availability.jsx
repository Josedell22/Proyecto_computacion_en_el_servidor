import { useRef, useState } from "react";
import { CalendarClock, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { api, formatTime } from "../api/client";
import { useResource } from "../hooks/useResource";
import { ConfirmDialog, Empty, Loading, Notice, PageHeading, panel, primaryButton, secondaryButton } from "../components/AcademicUI";

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const blank = { weekday: "1", startTime: "14:00", endTime: "16:00" };

export default function Availability() {
  const resource = useResource("/api/availability");
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const formRef = useRef(null);

  async function save(event) {
    event.preventDefault();
    if (busy) return;
    setError(""); setMessage("");
    if (form.endTime <= form.startTime) { setError("La hora de fin debe ser posterior a la de inicio."); return; }
    setBusy(true);
    try {
      await api("/api/availability" + (editing ? "/" + editing : ""), { method: editing ? "PUT" : "POST", body: JSON.stringify(form) });
      setMessage(editing ? "Horario actualizado." : "Horario agregado.");
      setEditing(null); setForm(blank); resource.reload();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (busy) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await api("/api/availability/" + deleting.id, { method: "DELETE" });
      if (editing === deleting.id) { setEditing(null); setForm(blank); }
      setDeleting(null); setMessage("Horario eliminado."); resource.reload();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  function edit(slot) {
    setEditing(slot.id); setError(""); setMessage("");
    setForm({ weekday: String(slot.weekday), startTime: formatTime(slot.start_time), endTime: formatTime(slot.end_time) });
    formRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    formRef.current.querySelector("select").focus({ preventScroll: true });
  }

  return <div className="space-y-6">
    <PageHeading eyebrow="Tu agenda" title="Horarios de disponibilidad" description="Comparte las franjas semanales en las que puedes ofrecer asesorías. Los horarios se muestran en tu perfil." />
    <Notice error={!deleting && (error || resource.error)} message={message} retry={resource.error ? resource.reload : undefined} />
    <form ref={formRef} className={panel} onSubmit={save}>
      <div className="mb-5 flex items-center gap-3"><span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600"><CalendarClock size={22} /></span><div><h2 className="font-bold text-slate-900">{editing ? "Editar horario" : "Agregar disponibilidad"}</h2><p className="mt-1 text-xs text-slate-500">Franjas semanales · Hora de Colombia (UTC−5)</p></div></div>
      <fieldset disabled={busy} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div><label htmlFor="slot-day">Día de la semana</label><select id="slot-day" value={form.weekday} onChange={(e) => setForm({ ...form, weekday: e.target.value })}>{DAYS.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></div>
        <div><label htmlFor="slot-start">Hora de inicio</label><input id="slot-start" type="time" required value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></div>
        <div><label htmlFor="slot-end">Hora de fin</label><input id="slot-end" type="time" required value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></div>
        <div className="flex flex-wrap gap-2 sm:col-span-3"><button type="submit" className={primaryButton}>{editing ? <Save size={16} /> : <Plus size={16} />}{busy ? "Guardando..." : editing ? "Guardar cambios" : "Agregar horario"}</button>{editing && <button className={secondaryButton} type="button" onClick={() => { setEditing(null); setForm(blank); setError(""); }}>Cancelar edición</button>}</div>
      </fieldset>
    </form>
    <div className="flex items-center justify-between"><h2 className="font-bold text-slate-900">Mis franjas semanales</h2>{!resource.loading && <span className="text-sm text-slate-500">{resource.data?.availability.length || 0} registradas</span>}</div>
    {resource.loading ? <Loading /> : !resource.error && <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {!resource.data?.availability.length && <Empty icon={CalendarClock} title="Tu agenda está por empezar">Agrega tu primer horario para que otros estudiantes sepan cuándo pueden contar contigo.</Empty>}
      {resource.data?.availability.map((slot) => <article className={panel + (editing === slot.id ? " ring-2 ring-indigo-400" : "")} key={slot.id}>
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Cada semana</p><h3 className="mt-2 text-xl font-bold text-slate-900">{slot.weekdayLabel}</h3>
        <p className="mt-3 text-lg tabular-nums text-slate-600">{formatTime(slot.start_time)} <span className="px-1 text-slate-300">—</span> {formatTime(slot.end_time)}</p>
        <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4"><button className={secondaryButton} onClick={() => edit(slot)} type="button" disabled={busy}><Pencil size={14} />Editar</button><button className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50" onClick={() => { setDeleting(slot); setError(""); }} type="button" disabled={busy}><Trash2 size={14} />Eliminar</button></div>
      </article>)}
    </div>}
    <ConfirmDialog open={!!deleting} title="Eliminar disponibilidad" confirmLabel="Eliminar horario" busy={busy} onConfirm={remove} onClose={() => { setDeleting(null); setError(""); }}>
      <p>Se eliminará la franja del {deleting?.weekdayLabel.toLowerCase()} de {formatTime(deleting?.start_time)} a {formatTime(deleting?.end_time)}. Las sesiones ya confirmadas conservarán su fecha.</p><Notice error={error} />
    </ConfirmDialog>
  </div>;
}
