import { useEffect, useState } from "react";
import { api, formatDate, STATUS_LABEL } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export default function Requests() {
  const { user } = useAuth();
  const [tab, setTab] = useState("sent");
  const [subjects, setSubjects] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ subjectId: "", description: "", preferredAt: "" });
  const [error, setError] = useState("");
  const [fields, setFields] = useState({});

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
    <>
      <h2>Solicitudes de ayuda y asesoría</h2>
      {error && <div className="alert">{error}</div>}
      <form className="panel" onSubmit={create}>
        <h3>Publicar solicitud de ayuda</h3>
        <div className="field">
          <label>Materia</label>
          <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}>
            <option value="">Seleccione</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {fields.subjectId && <small className="muted">{fields.subjectId}</small>}
        </div>
        <div className="field">
          <label>Tema que necesita reforzar</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          {fields.description && <small className="muted">{fields.description}</small>}
        </div>
        <div className="field">
          <label>Fecha y horario preferido</label>
          <input type="datetime-local" value={form.preferredAt} onChange={(e) => setForm({ ...form, preferredAt: e.target.value })} />
        </div>
        <button className="btn" type="submit">Publicar</button>
      </form>
      <div className="space" />
      <div className="tabs">
        <button className={tab === "sent" ? "active" : ""} onClick={() => setTab("sent")}>Enviadas</button>
        <button className={tab === "received" ? "active" : ""} onClick={() => setTab("received")}>Recibidas</button>
        <button className={tab === "open" ? "active" : ""} onClick={() => setTab("open")}>Abiertas de mis materias</button>
      </div>
      <div className="cards">
        {requests.length === 0 && <div className="empty">No hay solicitudes en esta vista.</div>}
        {requests.map((r) => (
          <article className="card" key={r.id}>
            <h3>{r.subject_name}</h3>
            <p>{r.description}</p>
            <p className="muted">Solicitante: {r.student_name} {r.advisor_name ? `· Asesor: ${r.advisor_name}` : ""}</p>
            <p className="muted">Preferida: {formatDate(r.preferred_at)}</p>
            <span className={`badge ${r.status}`}>{STATUS_LABEL[r.status]}</span>
            <div className="row" style={{ marginTop: 10 }}>
              {tab === "sent" && r.status === "pending" && r.student_id === user.id && (
                <button className="btn danger" onClick={() => act(r.id, "cancel")}>Cancelar</button>
              )}
              {(tab === "received" || tab === "open") && r.status === "pending" && r.student_id !== user.id && (
                <>
                  <button className="btn" onClick={() => act(r.id, "accept")}>Aceptar</button>
                  {r.advisor_id === user.id && (
                    <button className="btn secondary" onClick={() => act(r.id, "reject")}>Rechazar</button>
                  )}
                </>
              )}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
