import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ sent: 0, received: 0, sessions: 0, pubs: 0 });

  useEffect(() => {
    Promise.all([
      api("/api/requests"),
      api("/api/requests?scope=received"),
      api("/api/sessions"),
      api("/api/publications"),
    ]).then(([sent, received, sessions, pubs]) => {
      setStats({
        sent: sent.requests.length,
        received: received.requests.length,
        sessions: sessions.sessions.length,
        pubs: pubs.publications.length,
      });
    }).catch(() => {});
  }, []);

  return (
    <>
      <h2>Panel principal</h2>
      <p className="muted">Bienvenido, {user.name}. Desde aquí puedes gestionar asesorías y publicaciones.</p>
      {!profile?.complete && <div className="alert">{profile?.message}</div>}
      {profile?.complete && <div className="ok">{profile.message}</div>}
      <div className="grid">
        <article className="card"><h3>{stats.sent}</h3><p>Solicitudes enviadas</p></article>
        <article className="card"><h3>{stats.received}</h3><p>Solicitudes recibidas</p></article>
        <article className="card"><h3>{stats.sessions}</h3><p>Sesiones</p></article>
        <article className="card"><h3>{stats.pubs}</h3><p>Publicaciones visibles</p></article>
      </div>
      <div className="space" />
      <div className="row">
        <Link className="btn" to="/solicitudes">Crear solicitud</Link>
        <Link className="btn secondary" to="/asesores">Buscar asesores</Link>
        <Link className="btn secondary" to="/publicaciones/nueva">Nueva publicación</Link>
      </div>
    </>
  );
}
