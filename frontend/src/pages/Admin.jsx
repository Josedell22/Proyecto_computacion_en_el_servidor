import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api, formatDate, STATUS_LABEL } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Check, FileWarning, ShieldCheck, Users, X } from "lucide-react";
import { Empty, Loading, Notice, PageHeading } from "../components/AcademicUI";
import Button from "../components/ui/Button";
import { Tab, TabPanel, Tabs } from "../components/ui/Tabs";

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyUserId, setBusyUserId] = useState(null);
  const [busyReportId, setBusyReportId] = useState(null);

  async function load(signal) {
    setLoading(true);
    setError("");
    try {
      const [u, r, rep] = await Promise.all([
        api("/api/admin/users", { signal }),
        api("/api/admin/requests", { signal }),
        api("/api/admin/reports", { signal }),
      ]);
      setUsers(u.users);
      setRequests(r.requests);
      setReports(rep.reports);
    } catch (err) {
      if (!signal?.aborted) setError(err.message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.role !== "admin") return;
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [user]);

  if (user?.role !== "admin") return <Navigate to="/panel" replace />;

  async function toggleUser(row) {
    if (busyUserId) return;
    setBusyUserId(row.id);
    try {
      await api(`/api/admin/users/${row.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !row.is_active }),
      });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyUserId(null);
    }
  }

  async function moderate(id, action) {
    if (busyReportId) return;
    setBusyReportId(id);
    try {
      await api(`/api/admin/reports/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyReportId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Control de plataforma"
        title="Administración"
        description="Gestiona usuarios, solicitudes y reportes de contenido."
      />
      <Notice error={error} retry={() => load()} />

      <Tabs value={tab} onChange={setTab} ariaLabel="Secciones de administración">
        <Tab value="users" icon={Users}>Estudiantes</Tab>
        <Tab value="requests" icon={ShieldCheck}>Solicitudes</Tab>
        <Tab value="reports" icon={FileWarning}>Reportes</Tab>
      </Tabs>

      {loading ? (
        <Loading />
      ) : (
        <>
          <TabPanel value="users">
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-[700px] w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Nombre</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Correo</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Rol</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5}>
                        <Empty icon={Users} title="No hay estudiantes registrados">
                          Aparecerán aquí los usuarios que se registren en la plataforma.
                        </Empty>
                      </td>
                    </tr>
                  )}
                  {users.map((u) => (
                    <tr className="border-t border-slate-100" key={u.id}>
                      <td className="px-5 py-4 font-semibold text-slate-800">{u.name}</td>
                      <td className="px-5 py-4 text-slate-600">{u.email}</td>
                      <td className="px-5 py-4 capitalize text-slate-600">{u.role}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${u.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                          {u.is_active ? "Activo" : "Desactivado"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {u.role !== "admin" && (
                          <Button
                            variant="ghost"
                            className={u.is_active ? "bg-rose-50 text-rose-600 hover:bg-rose-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}
                            onClick={() => toggleUser(u)}
                            loading={busyUserId === u.id}
                            disabled={busyUserId !== null}
                            type="button"
                          >
                            {u.is_active ? <><X size={14} /> Desactivar</> : <><Check size={14} /> Activar</>}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabPanel>

          <TabPanel value="requests">
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-[700px] w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Materia</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Solicitante</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Asesor</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Estado</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={5}>
                        <Empty icon={ShieldCheck} title="No hay solicitudes registradas">
                          Aquí se listarán todas las solicitudes de asesoría de la plataforma.
                        </Empty>
                      </td>
                    </tr>
                  )}
                  {requests.map((r) => (
                    <tr className="border-t border-slate-100" key={r.id}>
                      <td className="px-5 py-4 font-semibold text-slate-800">{r.subject_name}</td>
                      <td className="px-5 py-4 text-slate-600">{r.student_name}</td>
                      <td className="px-5 py-4 text-slate-600">{r.advisor_name || "—"}</td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          {STATUS_LABEL[r.status]}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500">{formatDate(r.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabPanel>

          <TabPanel value="reports">
            {reports.length === 0 ? (
              <Empty icon={FileWarning} title="No hay reportes activos">
                Los reportes de contenido aparecerán aquí cuando un usuario los envíe.
              </Empty>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {reports.map((r) => (
                  <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={r.id}>
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-lg font-bold text-slate-900">{r.title}</h2>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${r.status === "active" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                        {r.status}
                      </span>
                    </div>
                    <p className="mt-4 text-slate-700">Motivo: {r.reason}</p>
                    <p className="mt-2 text-sm text-slate-500">Reportó {r.reporter_name} · Autor {r.author_name} · {formatDate(r.created_at)}</p>
                    {r.status === "active" && (
                      <div className="mt-5 flex gap-2">
                        <Button
                          variant="ghost"
                          className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          onClick={() => moderate(r.id, "keep")}
                          loading={busyReportId === r.id}
                          disabled={busyReportId !== null}
                          type="button"
                        >
                          <Check size={15} /> Mantener
                        </Button>
                        <Button
                          variant="ghost"
                          className="bg-rose-50 text-rose-600 hover:bg-rose-100"
                          onClick={() => moderate(r.id, "remove")}
                          loading={busyReportId === r.id}
                          disabled={busyReportId !== null}
                          type="button"
                        >
                          <X size={15} /> Retirar
                        </Button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </TabPanel>
        </>
      )}
    </div>
  );
}
