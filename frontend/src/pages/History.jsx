import { useEffect, useState } from "react";
import { api, formatDate, STATUS_LABEL } from "../api/client";

export default function History() {
  const [items, setItems] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [status, setStatus] = useState("");
  const [subjectId, setSubjectId] = useState("");

  async function load(nextStatus = status, nextSubject = subjectId) {
    const qs = new URLSearchParams();
    if (nextStatus) qs.set("status", nextStatus);
    if (nextSubject) qs.set("subjectId", nextSubject);
    const data = await api(`/api/history?${qs.toString()}`);
    setItems(data.history);
  }

  useEffect(() => {
    api("/api/subjects").then((d) => setSubjects(d.subjects));
    load("", "").catch(() => {});
  }, []);

  return (
    <>
      <h2>Historial</h2>
      <div className="row">
        <select value={status} onChange={(e) => { setStatus(e.target.value); load(e.target.value, subjectId); }}>
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_LABEL).filter(([k]) => !["confirmed"].includes(k)).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={subjectId} onChange={(e) => { setSubjectId(e.target.value); load(status, e.target.value); }}>
          <option value="">Todas las materias</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <table>
        <thead>
          <tr>
            <th>Materia</th>
            <th>Fecha</th>
            <th>Participantes</th>
            <th>Estado</th>
            <th>Valoración</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id}>
              <td>{i.subject_name}</td>
              <td>{formatDate(i.scheduled_at || i.created_at)}</td>
              <td>{i.student_name} / {i.advisor_name || "Sin asesor"}</td>
              <td><span className={`badge ${i.status}`}>{STATUS_LABEL[i.status]}</span></td>
              <td>{i.rated ? `${i.stars} ★` : i.session_id ? "Sin valorar" : "N/A"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
