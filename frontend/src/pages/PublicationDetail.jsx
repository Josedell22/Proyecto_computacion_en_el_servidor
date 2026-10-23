import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, formatDate } from "../api/client";
import { useAuth } from "../auth/AuthContext";

const REASONS = [
  "Contenido inapropiado",
  "Información incorrecta",
  "Incumple las reglas",
  "Spam o publicidad",
  "Otro",
];

export default function PublicationDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  async function load() {
    setData(await api(`/api/publications/${id}`));
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [id]);

  async function remove() {
    await api(`/api/publications/${id}`, { method: "DELETE" });
    navigate("/publicaciones");
  }

  async function report(e) {
    e.preventDefault();
    setError("");
    try {
      await api(`/api/publications/${id}/report`, {
        method: "POST",
        body: JSON.stringify({ reason, details }),
      });
      setOk("Reporte registrado.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!data) return <p>Cargando...</p>;
  const p = data.publication;

  return (
    <>
      <h2>{p.title}</h2>
      {error && <div className="alert">{error}</div>}
      {ok && <div className="ok">{ok}</div>}
      <p className="muted">{p.subject_name} · {p.author_name} · {formatDate(p.created_at)}</p>
      <div className="panel">
        <p>{p.description}</p>
        {p.content && <p>{p.content}</p>}
        {p.fileUrl && <p><a href={p.fileUrl} target="_blank" rel="noreferrer">Descargar archivo ({p.original_name})</a></p>}
      </div>
      {p.user_id === user.id && (
        <div className="row" style={{ marginTop: 12 }}>
          <Link className="btn secondary" to={`/publicaciones/${id}/editar`}>Editar</Link>
          <button className="btn danger" onClick={remove}>Eliminar</button>
        </div>
      )}
      {p.user_id !== user.id && !data.alreadyReported && (
        <form className="panel" style={{ marginTop: 16 }} onSubmit={report}>
          <h3>Reportar publicación</h3>
          <div className="field">
            <label>Motivo</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)}>
              {REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Detalle</label>
            <textarea value={details} onChange={(e) => setDetails(e.target.value)} />
          </div>
          <button className="btn danger" type="submit">Enviar reporte</button>
        </form>
      )}
      {data.alreadyReported && <div className="ok">Ya tienes un reporte activo sobre esta publicación.</div>}
    </>
  );
}
