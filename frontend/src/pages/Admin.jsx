import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api, formatDate, STATUS_LABEL } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    const [u, r, rep] = await Promise.all([
      api("/api/admin/users"),
      api("/api/admin/requests"),
      api("/api/admin/reports"),
    ]);
    setUsers(u.users);
    setRequests(r.requests);
    setReports(rep.reports);
  }

  useEffect(() => {
    if (user?.role === "admin") load().catch((err) => setError(err.message));
  }, [user]);

  if (user?.role !== "admin") return <Navigate to="/panel" replace />;

  async function toggleUser(row) {
    await api(`/api/admin/users/${row.id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: !row.is_active }),
    });
    await load();
  }

  async function moderate(id, action) {
    await api(`/api/admin/reports/${id}`, { method: "PATCH", body: JSON.stringify({ action }) });
    await load();
  }

  return (
    <>
      <h2>Panel administrativo</h2>
      {error && <div className="alert">{error}</div>}
      <div className="tabs">
        <button className={tab === "users" ? "active" : ""} onClick={() => setTab("users")}>Estudiantes</button>
        <button className={tab === "requests" ? "active" : ""} onClick={() => setTab("requests")}>Solicitudes</button>
        <button className={tab === "reports" ? "active" : ""} onClick={() => setTab("reports")}>Reportes</button>
      </div>
      {tab === "users" && (
        <table>
          <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.is_active ? "Activo" : "Desactivado"}</td>
                <td>
                  {u.role !== "admin" && (
                    <button className="btn secondary" onClick={() => toggleUser(u)}>
                      {u.is_active ? "Desactivar" : "Activar"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {tab === "requests" && (
        <table>
          <thead><tr><th>Materia</th><th>Solicitante</th><th>Asesor</th><th>Estado</th><th>Fecha</th></tr></thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td>{r.subject_name}</td>
                <td>{r.student_name}</td>
                <td>{r.advisor_name || "—"}</td>
                <td>{STATUS_LABEL[r.status]}</td>
                <td>{formatDate(r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {tab === "reports" && (
        <div className="cards">
          {reports.map((r) => (
            <article className="card" key={r.id}>
              <h3>{r.title}</h3>
              <p>Motivo: {r.reason}</p>
              <p className="muted">Reportó {r.reporter_name} · Autor {r.author_name} · {formatDate(r.created_at)}</p>
              <span className={`badge ${r.status}`}>{r.status}</span>
              {r.status === "active" && (
                <div className="row" style={{ marginTop: 8 }}>
                  <button className="btn secondary" onClick={() => moderate(r.id, "keep")}>Mantener</button>
                  <button className="btn danger" onClick={() => moderate(r.id, "remove")}>Retirar</button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
