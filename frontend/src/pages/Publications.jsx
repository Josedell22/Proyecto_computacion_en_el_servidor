import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatDate } from "../api/client";

export default function Publications() {
  const [items, setItems] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [q, setQ] = useState("");
  const [subjectId, setSubjectId] = useState("");

  async function load(term = q, subject = subjectId) {
    const qs = new URLSearchParams();
    if (term) qs.set("q", term);
    if (subject) qs.set("subjectId", subject);
    const data = await api(`/api/publications?${qs.toString()}`);
    setItems(data.publications);
  }

  useEffect(() => {
    api("/api/subjects").then((d) => setSubjects(d.subjects));
    load("", "").catch(() => {});
  }, []);

  return (
    <>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2>Publicaciones académicas</h2>
        <Link className="btn" to="/publicaciones/nueva">Nueva publicación</Link>
      </div>
      <form className="row" onSubmit={(e) => { e.preventDefault(); load(); }}>
        <input placeholder="Buscar por título o materia" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          <option value="">Todas</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button className="btn secondary" type="submit">Buscar</button>
      </form>
      <div className="cards">
        {items.length === 0 && <div className="empty">No hay publicaciones disponibles.</div>}
        {items.map((p) => (
          <article className="card" key={p.id}>
            <h3>{p.title}</h3>
            <p className="muted">{p.subject_name} · {p.author_name} · {formatDate(p.created_at)}</p>
            <p>{p.description}</p>
            <Link className="btn secondary" to={`/publicaciones/${p.id}`}>Ver detalle</Link>
          </article>
        ))}
      </div>
    </>
  );
}
