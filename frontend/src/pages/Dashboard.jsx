import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { ArrowRight, BookOpen, ClipboardList, GraduationCap, Users } from "lucide-react";
import { Notice, PageHeading } from "../components/AcademicUI";
import BrandLoader from "../components/BrandLoader";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState({ sent: 0, received: 0, sessions: 0, pubs: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api("/api/requests"),
      api("/api/requests?scope=received"),
      api("/api/sessions"),
      api("/api/publications"),
    ])
      .then(([sent, received, sessions, pubs]) => {
        setStats({
          sent: sent.requests.length,
          received: received.requests.length,
          sessions: sessions.sessions.length,
          pubs: pubs.publications.length,
        });
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <BrandLoader variant="page" message="Cargando panel..." />;

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Tu espacio de aprendizaje"
        title="Panel principal"
        description={`Bienvenido, ${user.name}. Desde aquí puedes gestionar asesorías y publicaciones.`}
      />
      <Notice error={error} />
      {profile?.complete ? (
        <Notice message={profile.message} />
      ) : (
        <Notice error={profile?.message || "Completa tu perfil para aprovechar todas las funciones."} />
      )}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <ClipboardList size={20} />
            </span>
            <h3 className="text-3xl font-bold text-slate-900">{stats.sent}</h3>
          </div>
          <p className="mt-4 text-sm font-medium text-slate-500">Solicitudes enviadas</p>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Users size={20} />
            </span>
            <h3 className="text-3xl font-bold text-slate-900">{stats.received}</h3>
          </div>
          <p className="mt-4 text-sm font-medium text-slate-500">Solicitudes recibidas</p>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <GraduationCap size={20} />
            </span>
            <h3 className="text-3xl font-bold text-slate-900">{stats.sessions}</h3>
          </div>
          <p className="mt-4 text-sm font-medium text-slate-500">Sesiones</p>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <BookOpen size={20} />
            </span>
            <h3 className="text-3xl font-bold text-slate-900">{stats.pubs}</h3>
          </div>
          <p className="mt-4 text-sm font-medium text-slate-500">Publicaciones visibles</p>
        </Card>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link to="/solicitudes">
          <Button>
            Crear solicitud <ArrowRight size={17} />
          </Button>
        </Link>
        <Link to="/asesores">
          <Button variant="secondary">Buscar asesores</Button>
        </Link>
        <Link to="/disponibilidad">
          <Button variant="secondary">Mis horarios</Button>
        </Link>
        <Link to="/sesiones">
          <Button variant="secondary">Mis sesiones</Button>
        </Link>
        <Link to="/historial">
          <Button variant="secondary">Ver historial</Button>
        </Link>
        <Link to="/publicaciones/nueva">
          <Button variant="secondary">Nueva publicación</Button>
        </Link>
      </div>
    </div>
  );
}
