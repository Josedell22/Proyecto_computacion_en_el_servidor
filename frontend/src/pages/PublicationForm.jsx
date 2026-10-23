import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";

export default function PublicationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", content: "", subjectId: "" });
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/subjects").then((d) => setSubjects(d.subjects));
    if (id) {
      api(`/api/publications/${id}`).then((d) => {
        setForm({
          title: d.publication.title,
          description: d.publication.description,
          content: d.publication.content || "",
          subjectId: d.publication.subject_id,
        });
      }).catch((err) => setError(err.message));
    }
  }, [id]);

  async function save(e) {
    e.preventDefault();
    setError("");
    const body = new FormData();
    body.append("title", form.title);
    body.append("description", form.description);
    body.append("content", form.content);
    body.append("subjectId", form.subjectId);
    if (file) body.append("file", file);
    try {
      if (id) {
        await api(`/api/publications/${id}`, { method: "PUT", body });
        navigate(`/publicaciones/${id}`);
      } else {
        const created = await api("/api/publications", { method: "POST", body });
        navigate(`/publicaciones/${created.publication.id}`);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="panel" onSubmit={save}>
      <h2>{id ? "Editar publicación" : "Crear publicación"}</h2>
      {error && <div className="alert">{error}</div>}
      <div className="field"><label>Título</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
      <div className="field">
        <label>Materia</label>
        <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} required>
          <option value="">Seleccione</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className="field"><label>Descripción</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></div>
      <div className="field"><label>Contenido</label><textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
      <div className="field">
        <label>Archivo (PDF, DOC, DOCX, PNG, JPG · máx. 5 MB)</label>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      </div>
      <button className="btn" type="submit">Publicar</button>
    </form>
  );
}
