import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api, formatDate, STATUS_LABEL } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Check, FileWarning, ShieldCheck, Users, X } from "lucide-react";

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
    <div className="space-y-6">
      <div><p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Control de plataforma</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Administración</h1><p className="mt-2 text-slate-600">Gestiona usuarios, solicitudes y reportes de contenido.</p></div>
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      <div className="flex w-full gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 sm:w-fit">
        <button className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold ${tab === "users" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`} onClick={() => setTab("users")} type="button"><Users size={16} /> Estudiantes</button>
        <button className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold ${tab === "requests" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`} onClick={() => setTab("requests")} type="button"><ShieldCheck size={16} /> Solicitudes</button>
        <button className={`inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold ${tab === "reports" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`} onClick={() => setTab("reports")} type="button"><FileWarning size={16} /> Reportes</button>
      </div>
      {tab === "users" && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm"><table className="min-w-[700px] w-full"><thead className="bg-slate-50"><tr><th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Nombre</th><th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Correo</th><th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Rol</th><th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Estado</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr className="border-t border-slate-100" key={u.id}>
                <td className="px-5 py-4 font-semibold text-slate-800">{u.name}</td><td className="px-5 py-4 text-slate-600">{u.email}</td><td className="px-5 py-4 capitalize text-slate-600">{u.role}</td>
                <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${u.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{u.is_active ? "Activo" : "Desactivado"}</span></td>
                <td className="px-5 py-4">
                  {u.role !== "admin" && (
                    <button className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold ${u.is_active ? "bg-rose-50 text-rose-600 hover:bg-rose-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`} onClick={() => toggleUser(u)} type="button">
                      {u.is_active ? <><X size={14} /> Desactivar</> : <><Check size={14} /> Activar</>}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      {tab === "requests" && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm"><table className="min-w-[700px] w-full"><thead className="bg-slate-50"><tr><th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Materia</th><th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Solicitante</th><th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Asesor</th><th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Estado</th><th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Fecha</th></tr></thead>
          <tbody>
            {requests.map((r) => (
              <tr className="border-t border-slate-100" key={r.id}>
                <td className="px-5 py-4 font-semibold text-slate-800">{r.subject_name}</td><td className="px-5 py-4 text-slate-600">{r.student_name}</td><td className="px-5 py-4 text-slate-600">{r.advisor_name || "—"}</td><td className="px-5 py-4"><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">{STATUS_LABEL[r.status]}</span></td><td className="px-5 py-4 text-sm text-slate-500">{formatDate(r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      {tab === "reports" && (
        <div className="grid gap-5 md:grid-cols-2">
          {reports.map((r) => (
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={r.id}>
              <div className="flex items-start justify-between gap-3"><h2 className="text-lg font-bold text-slate-900">{r.title}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${r.status === "active" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{r.status}</span></div>
              <p className="mt-4 text-slate-700">Motivo: {r.reason}</p>
              <p className="mt-2 text-sm text-slate-500">Reportó {r.reporter_name} · Autor {r.author_name} · {formatDate(r.created_at)}</p>
              {r.status === "active" && (
                <div className="mt-5 flex gap-2">
                  <button className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100" onClick={() => moderate(r.id, "keep")} type="button"><Check size={15} /> Mantener</button>
                  <button className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-100" onClick={() => moderate(r.id, "remove")} type="button"><X size={15} /> Retirar</button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
