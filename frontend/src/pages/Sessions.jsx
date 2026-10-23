import { useEffect, useState } from "react";
import { api, formatDate, STATUS_LABEL } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export default function Sessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState("");
  const [rating, setRating] = useState({});

  async function load() {
    const data = await api("/api/sessions");
    setSessions(data.sessions);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function finish(id) {
    setError("");
    try {
      await api(`/api/sessions/${id}/finish`, { method: "PATCH" });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function rate(id) {
    setError("");
    try {
      await api(`/api/sessions/${id}/rating`, {
        method: "POST",
        body: JSON.stringify(rating[id] || { stars: 5, comment: "" }),
      });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <h2>Sesiones de asesoría</h2>
      {error && <div className="alert">{error}</div>}
      <div className="cards">
        {sessions.length === 0 && <div className="empty">Aún no hay sesiones registradas.</div>}
        {sessions.map((s) => (
          <article className="card" key={s.id}>
            <h3>{s.subject_name}</h3>
            <p>Solicitante: {s.student_name}</p>
            <p>Asesor: {s.advisor_name}</p>
            <p className="muted">{formatDate(s.scheduled_at)}</p>
            <span className={`badge ${s.status}`}>{STATUS_LABEL[s.status]}</span>
            {s.status === "confirmed" && (
              <div className="space"><button className="btn" onClick={() => finish(s.id)}>Marcar como finalizada</button></div>
            )}
            {s.status === "finished" && s.student_id === user.id && !s.stars && (
              <div className="space">
                <label>Valoración (1 a 5)</label>
                <select
                  value={rating[s.id]?.stars || 5}
                  onChange={(e) => setRating({ ...rating, [s.id]: { ...rating[s.id], stars: Number(e.target.value) } })}
                >
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} estrellas</option>)}
                </select>
                <textarea
                  placeholder="Comentario (opcional)"
                  value={rating[s.id]?.comment || ""}
                  onChange={(e) => setRating({ ...rating, [s.id]: { ...rating[s.id], comment: e.target.value } })}
                />
                <button className="btn gold" onClick={() => rate(s.id)}>Enviar valoración</button>
              </div>
            )}
            {s.stars && <p className="stars">Valorada: {"★".repeat(s.stars)} {s.rating_comment || ""}</p>}
          </article>
        ))}
      </div>
    </>
  );
}
