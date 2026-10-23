import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";

export default function Tutors() {
  const [params, setParams] = useSearchParams();
  const [subjects, setSubjects] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [error, setError] = useState("");
  const subjectId = params.get("subjectId") || "";

  useEffect(() => {
    api("/api/subjects").then((d) => setSubjects(d.subjects));
  }, []);

  useEffect(() => {
    if (!subjectId) {
      setTutors([]);
      return;
    }
    api(`/api/tutors?subjectId=${subjectId}`)
      .then((d) => setTutors(d.tutors))
      .catch((err) => setError(err.message));
  }, [subjectId]);

  return (
    <>
      <h2>Buscar estudiantes disponibles</h2>
      {error && <div className="alert">{error}</div>}
      <div className="field" style={{ maxWidth: 360 }}>
        <label>Materia</label>
        <select value={subjectId} onChange={(e) => setParams({ subjectId: e.target.value })}>
          <option value="">Seleccione una materia</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className="cards">
        {subjectId && tutors.length === 0 && <div className="empty">No hay estudiantes disponibles para esta materia.</div>}
        {tutors.map((t) => (
          <article className="card" key={t.id}>
            <h3>{t.name}</h3>
            <p className="muted">{t.program} · Semestre {t.semester || "N/D"}</p>
            <p className="stars">{"★".repeat(Math.round(t.avg_rating))}{"☆".repeat(5 - Math.round(t.avg_rating))} {Number(t.avg_rating).toFixed(1)} ({t.rating_count})</p>
            <Link className="btn secondary" to={`/asesores/${t.id}?subjectId=${subjectId}`}>Ver perfil</Link>
          </article>
        ))}
      </div>
    </>
  );
}
