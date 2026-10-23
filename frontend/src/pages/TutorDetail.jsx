import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api, formatTime } from "../api/client";

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

  if (!data) return <p>Cargando...</p>;
  const { tutor, subjects, availability } = data;

  return (
    <>
      <h2>{tutor.name}</h2>
      <p className="muted">{tutor.program} · Semestre {tutor.semester || "N/D"}</p>
      <p>{tutor.bio}</p>
      <p className="stars">Valoración promedio: {Number(tutor.avg_rating).toFixed(1)} / 5 ({tutor.rating_count})</p>
      {error && <div className="alert">{error}</div>}
      {ok && <div className="ok">{ok}</div>}
      <div className="cards">
        <article className="panel">
          <h3>Materias que domina</h3>
          {subjects.map((s) => <span className="badge" key={s.id} style={{ marginRight: 6 }}>{s.name}</span>)}
          <h3>Disponibilidad</h3>
          {availability.length === 0 && <p className="muted">Sin horarios registrados.</p>}
          {availability.map((a) => (
            <p key={a.id}>{a.weekdayLabel}: {formatTime(a.start_time)} - {formatTime(a.end_time)}</p>
          ))}
        </article>
        <form className="panel" onSubmit={send}>
          <h3>Enviar solicitud de asesoría</h3>
          <div className="field">
            <label>Materia</label>
            <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} required>
              <option value="">Seleccione</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Tema</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          </div>
          <div className="field">
            <label>Fecha y hora preferida</label>
            <input type="datetime-local" value={form.preferredAt} onChange={(e) => setForm({ ...form, preferredAt: e.target.value })} />
          </div>
          <button className="btn" type="submit">Enviar solicitud</button>
        </form>
      </div>
    </>
  );
}
