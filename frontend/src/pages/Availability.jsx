import { useRef, useState } from "react";
import { CalendarClock, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { api, formatTime } from "../api/client";
import { useResource } from "../hooks/useResource";
import { ConfirmDialog, Empty, Loading, Notice, PageHeading } from "../components/AcademicUI";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Field from "../components/ui/Field";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";

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
    if (busy || !deleting) return;
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

  return (
    <div className="space-y-6">
      <PageHeading eyebrow="Tu agenda" title="Horarios de disponibilidad" description="Comparte las franjas semanales en las que puedes ofrecer asesorías. Los horarios se muestran en tu perfil." />
      <Notice error={!deleting && (error || resource.error)} message={message} retry={resource.error ? resource.reload : undefined} />
      <Card>
        <form ref={formRef} onSubmit={save}>
          <div className="mb-5 flex items-center gap-3">
            <span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600"><CalendarClock size={22} /></span>
            <div>
              <h2 className="font-bold text-slate-900">{editing ? "Editar horario" : "Agregar disponibilidad"}</h2>
              <p className="mt-1 text-xs text-slate-500">Franjas semanales · Hora de Colombia (UTC−5)</p>
            </div>
          </div>
          <fieldset disabled={busy} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Día de la semana" htmlFor="slot-day">
              <Select
                id="slot-day"
                value={form.weekday}
                onChange={(e) => setForm({ ...form, weekday: e.target.value })}
                options={DAYS.map((day, index) => ({ value: String(index), label: day }))}
                placeholder={null}
              />
            </Field>
            <Field label="Hora de inicio" htmlFor="slot-start">
              <Input id="slot-start" type="time" required value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </Field>
            <Field label="Hora de fin" htmlFor="slot-end">
              <Input id="slot-end" type="time" required value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            </Field>
            <div className="flex flex-wrap gap-2 sm:col-span-3">
              <Button type="submit" loading={busy}>
                {editing ? <><Save size={16} /> Guardar cambios</> : <><Plus size={16} /> Agregar horario</>}
              </Button>
              {editing && (
                <Button variant="secondary" type="button" onClick={() => { setEditing(null); setForm(blank); setError(""); }}>
                  Cancelar edición
                </Button>
              )}
            </div>
          </fieldset>
        </form>
      </Card>
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-900">Mis franjas semanales</h2>
        {!resource.loading && <span className="text-sm text-slate-500">{resource.data?.availability.length || 0} registradas</span>}
      </div>
      {resource.loading ? (
        <Loading />
      ) : (
        !resource.error && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {!resource.data?.availability.length && (
              <Empty icon={CalendarClock} title="Tu agenda está por empezar">
                Agrega tu primer horario para que otros estudiantes sepan cuándo pueden contar contigo.
              </Empty>
            )}
            {resource.data?.availability.map((slot) => (
              <Card key={slot.id} className={editing === slot.id ? "ring-2 ring-indigo-400" : ""}>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Cada semana</p>
                <h3 className="mt-2 text-xl font-bold text-slate-900">{slot.weekdayLabel}</h3>
                <p className="mt-3 text-lg tabular-nums text-slate-600">
                  {formatTime(slot.start_time)} <span className="px-1 text-slate-300">—</span> {formatTime(slot.end_time)}
                </p>
                <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  <Button variant="secondary" onClick={() => edit(slot)} type="button" disabled={busy}>
                    <Pencil size={14} /> Editar
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-rose-700 hover:bg-rose-50"
                    onClick={() => { setDeleting(slot); setError(""); }}
                    type="button"
                    disabled={busy}
                  >
                    <Trash2 size={14} /> Eliminar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )
      )}
      <ConfirmDialog
        open={!!deleting}
        title="Eliminar disponibilidad"
        confirmLabel="Eliminar horario"
        busy={busy}
        onConfirm={remove}
        onClose={() => { setDeleting(null); setError(""); }}
      >
        <p>Se eliminará la franja del {deleting?.weekdayLabel.toLowerCase()} de {formatTime(deleting?.start_time)} a {formatTime(deleting?.end_time)}. Las sesiones ya confirmadas conservarán su fecha.</p>
        <Notice error={error} />
      </ConfirmDialog>
    </div>
  );
}
