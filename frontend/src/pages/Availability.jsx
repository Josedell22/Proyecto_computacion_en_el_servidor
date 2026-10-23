import { useEffect, useState } from "react";
import { api, formatTime } from "../api/client";

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export default function Availability() {
  const [slots, setSlots] = useState([]);
  const [form, setForm] = useState({ weekday: "1", startTime: "14:00", endTime: "16:00" });
  const [error, setError] = useState("");

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
    try {
      await api("/api/availability", { method: "POST", body: JSON.stringify(form) });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    await api(`/api/availability/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <>
      <h2>Disponibilidad</h2>
      <p className="muted">Indica los días y horarios en los que puedes ofrecer asesorías.</p>
      {error && <div className="alert">{error}</div>}
      <form className="panel row" onSubmit={create}>
        <select value={form.weekday} onChange={(e) => setForm({ ...form, weekday: Number(e.target.value) })}>
          {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
        </select>
        <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
        <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
        <button className="btn" type="submit">Agregar</button>
      </form>
      <div className="cards">
        {slots.map((s) => (
          <article className="card" key={s.id}>
            <h3>{s.weekdayLabel}</h3>
            <p>{formatTime(s.start_time)} - {formatTime(s.end_time)}</p>
            <button className="btn danger" onClick={() => remove(s.id)}>Eliminar</button>
          </article>
        ))}
      </div>
    </>
  );
}
