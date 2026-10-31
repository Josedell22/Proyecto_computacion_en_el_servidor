import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { ArrowRight, BookOpen, ClipboardList, GraduationCap, Users } from "lucide-react";

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
    <div className="space-y-6">
      <div><p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Tu espacio de aprendizaje</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Panel principal</h1><p className="mt-2 text-slate-600">Bienvenido, {user.name}. Desde aquí puedes gestionar asesorías y publicaciones.</p></div>
      {!profile?.complete && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">{profile?.message}</div>}
      {profile?.complete && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{profile.message}</div>}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><ClipboardList size={20} /></span><h3 className="text-3xl font-bold text-slate-900">{stats.sent}</h3></div><p className="mt-4 text-sm font-medium text-slate-500">Solicitudes enviadas</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><Users size={20} /></span><h3 className="text-3xl font-bold text-slate-900">{stats.received}</h3></div><p className="mt-4 text-sm font-medium text-slate-500">Solicitudes recibidas</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><GraduationCap size={20} /></span><h3 className="text-3xl font-bold text-slate-900">{stats.sessions}</h3></div><p className="mt-4 text-sm font-medium text-slate-500">Sesiones</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><BookOpen size={20} /></span><h3 className="text-3xl font-bold text-slate-900">{stats.pubs}</h3></div><p className="mt-4 text-sm font-medium text-slate-500">Publicaciones visibles</p></article>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700" to="/solicitudes">Crear solicitud <ArrowRight size={17} /></Link>
        <Link className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-600" to="/asesores">Buscar asesores</Link>
        <Link className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-600" to="/publicaciones/nueva">Nueva publicación</Link>
      </div>
    </div>
  );
}
