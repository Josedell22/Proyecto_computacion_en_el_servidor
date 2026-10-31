import { useEffect, useState } from "react";
import { api, formatTime } from "../api/client";
import { CalendarClock, Plus, Trash2 } from "lucide-react";

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function Availability() {
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState({ weekday: "1", startTime: "14:00", endTime: "16:00" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const data = await api("/api/availability");
    setSlots(data.availability);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function create(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await api("/api/availability", { method: "POST", body: JSON.stringify(form) });
      setMessage("Horario agregado.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    setError("");
    setMessage("");
    try {
      await api(`/api/availability/${id}`, { method: "DELETE" });
      setMessage("Horario eliminado.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Tu agenda</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Horarios de disponibilidad</h1>
        <p className="mt-2 text-slate-600">Indica los días y franjas en los que puedes ofrecer asesorías. Otros estudiantes podrán consultarlos en tu perfil.</p>
      </div>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}

      <form className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end" onSubmit={create}>
        <div className="flex-1">
          <label className="mb-2 block text-sm font-semibold text-slate-700">Día</label>
          <select
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
            value={form.weekday}
            onChange={(e) => setForm({ ...form, weekday: Number(e.target.value) })}
          >
            {DAYS.map((d, i) => (
              <option key={d} value={i}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Inicio</label>
          <input
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
            type="time"
            value={form.startTime}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Fin</label>
          <input
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
            type="time"
            value={form.endTime}
            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
          />
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700" type="submit">
          <Plus size={17} /> Agregar
        </button>
      </form>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {slots.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 md:col-span-2 lg:col-span-3">
            <CalendarClock className="mx-auto mb-3 text-slate-400" size={30} />
            Aún no has registrado horarios.
          </div>
        )}
        {slots.map((s) => (
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={s.id}>
            <h3 className="text-lg font-bold text-slate-900">{s.weekdayLabel}</h3>
            <p className="mt-1 text-slate-600">
              {formatTime(s.start_time)} - {formatTime(s.end_time)}
            </p>
            <button className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100" onClick={() => remove(s.id)} type="button">
              <Trash2 size={15} /> Eliminar
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
