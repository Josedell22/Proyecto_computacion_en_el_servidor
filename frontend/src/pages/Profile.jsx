import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export default function Profile() {
  const { refresh } = useAuth();
  const [data, setData] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selected, setSelected] = useState([]);
  const [form, setForm] = useState({ name: "", program: "", semester: "", bio: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const [profile, catalog] = await Promise.all([api("/api/profile"), api("/api/subjects")]);
    setData(profile);
    setForm({
      name: profile.user.name || "",
      program: profile.user.program || "",
      semester: profile.user.semester || "",
      bio: profile.user.bio || "",
    });
    setSelected(profile.subjects.map((s) => s.id));
    setSubjects(catalog.subjects);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function saveProfile(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const result = await api("/api/profile", { method: "PUT", body: JSON.stringify(form) });
      setData(result);
      await refresh();
      setMessage("Perfil actualizado.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveSubjects(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const result = await api("/api/profile/subjects", {
        method: "PUT",
        body: JSON.stringify({ subjectIds: selected }),
      });
      setData(result);
      await refresh();
      setMessage("Materias dominadas actualizadas.");
    } catch (err) {
      setError(err.message);
    }
  }

  if (!data) return <p>Cargando perfil...</p>;

  return (
    <>
      <h2>Perfil del estudiante</h2>
      {error && <div className="alert">{error}</div>}
      {message && <div className="ok">{message}</div>}
      <div className="ok">{data.profile.message}</div>
      <div className="cards">
        <form className="panel" onSubmit={saveProfile}>
          <h3>Información personal y académica</h3>
          <div className="field"><label>Nombre</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="field"><label>Programa académico</label><input value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })} /></div>
          <div className="field"><label>Semestre</label><input type="number" min="1" max="20" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} /></div>
          <div className="field"><label>Descripción personal</label><textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
          <button className="btn" type="submit">Guardar perfil</button>
        </form>
        <form className="panel" onSubmit={saveSubjects}>
          <h3>Materias que puedo asesorar</h3>
          <p className="muted">Solo estudiantes con dominio registrado pueden ofrecer asesoría en esa materia.</p>
          {subjects.map((s) => (
            <label key={s.id} style={{ fontWeight: 500, marginBottom: 8 }}>
              <input
                type="checkbox"
                checked={selected.includes(s.id)}
                onChange={(e) => {
                  setSelected((prev) => (e.target.checked ? [...prev, s.id] : prev.filter((id) => id !== s.id)));
                }}
              />{" "}
              {s.name}
            </label>
          ))}
          <div className="space" />
          <button className="btn secondary" type="submit">Guardar materias</button>
        </form>
      </div>
    </>
  );
}
