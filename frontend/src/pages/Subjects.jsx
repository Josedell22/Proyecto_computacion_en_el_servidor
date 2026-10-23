import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export default function Subjects() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [q, setQ] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", description: "" });

  async function load(term = q) {
    const data = await api(`/api/subjects?q=${encodeURIComponent(term)}${user.role === "admin" ? "&all=1" : ""}`);
    setSubjects(data.subjects);
    setMessage(data.message || "");
  }

  useEffect(() => {
    load("").catch((err) => setError(err.message));
  }, []);

  async function createSubject(e) {
    e.preventDefault();
    setError("");
    try {
      await api("/api/subjects", { method: "POST", body: JSON.stringify(form) });
      setForm({ name: "", description: "" });
      await load("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggle(subject) {
    await api(`/api/subjects/${subject.id}`, {
      method: "PUT",
      body: JSON.stringify({ isActive: !subject.is_active }),
    });
    await load("");
  }

  return (
    <>
      <h2>Materias</h2>
      {error && <div className="alert">{error}</div>}
      <form className="row" onSubmit={(e) => { e.preventDefault(); load(q); }}>
        <input placeholder="Buscar por nombre" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 320 }} />
        <button className="btn" type="submit">Buscar</button>
      </form>
      {message && <div className="ok">{message}</div>}
      <div className="cards">
        {subjects.map((s) => (
          <article className="card" key={s.id}>
            <h3>{s.name}</h3>
            <p className="muted">{s.description}</p>
            <span className={`badge ${s.is_active ? "accepted" : "cancelled"}`}>{s.is_active ? "Activa" : "Desactivada"}</span>
            {user.role === "admin" && (
              <div className="space">
                <button className="btn secondary" onClick={() => toggle(s)}>
                  {s.is_active ? "Desactivar" : "Activar"}
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
      {user.role === "admin" && (
        <form className="panel" style={{ marginTop: 20 }} onSubmit={createSubject}>
          <h3>Registrar materia</h3>
          <div className="field"><label>Nombre</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="field"><label>Descripción</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <button className="btn" type="submit">Crear materia</button>
        </form>
      )}
    </>
  );
}
