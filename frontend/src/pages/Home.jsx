import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ArrowRight, BookMarked, FolderDown, GraduationCap, HelpCircle, Users } from "lucide-react";

export default function Home() {
  const { user } = useAuth();

  const accessCards = [
    {
      title: "Solicitudes",
      description: "Consulta solicitudes abiertas y encuentra oportunidades de apoyo académico.",
      href: "/solicitudes",
      icon: HelpCircle,
      iconClass: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Asesores",
      description: "Busca asesores por materia y consulta su valoración promedio.",
      href: "/asesores",
      icon: Users,
      iconClass: "bg-indigo-50 text-indigo-600",
    },
    {
      title: "Publicaciones",
      description: "Accede a guías, apuntes y material académico en PDF, DOC e imágenes.",
      href: "/publicaciones",
      icon: FolderDown,
      iconClass: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <div className="relative isolate -mx-4 min-h-[calc(100vh-65px)] overflow-hidden bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] bg-slate-50 px-4 py-8 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="pointer-events-none absolute -left-10 -top-10 -z-10 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 -z-10 h-96 w-96 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="relative z-10 space-y-8">
      <section className="relative grid gap-8 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-6 text-white shadow-xl sm:p-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full border border-indigo-300/10 bg-indigo-400/10 blur-2xl" />
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-white/10 px-3 py-1.5 text-sm font-medium text-indigo-100">
            <GraduationCap size={17} />
            Aprende, comparte y conecta
          </div>
          <h1 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">
            Conecta con el apoyo académico que necesitas.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-indigo-100 sm:text-lg">
            StudyMatch reúne solicitudes de ayuda, asesores por materia y publicaciones académicas en un solo lugar.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-md transition hover:bg-indigo-700" to="/asesores">
              Buscar asesores <ArrowRight size={18} />
            </Link>
            <Link className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/20" to="/solicitudes">
              Publicar solicitud
            </Link>
          </div>
        </div>

        <aside className="rounded-2xl border border-slate-100 bg-white p-6 text-slate-800 shadow-xl">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <BookMarked size={22} />
          </div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Una cuenta, dos posibilidades</p>
          <h2 className="mt-2 text-xl font-bold">Hola, {user?.name}</h2>
          <p className="mt-3 leading-6 text-slate-600">
            Recuerda: puedes actuar como solicitante de ayuda y como asesor utilizando la misma cuenta.
          </p>
        </aside>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Explora StudyMatch</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">Accesos principales</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {accessCards.map(({ title, description, href, icon: Icon, iconClass }) => (
            <Link className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl" key={title} to={href}>
              <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl p-3 shadow-sm transition-transform group-hover:scale-110 ${iconClass}`}>
                <Icon size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">{title}</h3>
              <p className="mt-2 min-h-14 leading-6 text-slate-600">{description}</p>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
                Ver {title.toLowerCase()} <ArrowRight className="transition group-hover:translate-x-1" size={16} />
              </span>
            </Link>
          ))}
        </div>
      </section>
      </div>
    </div>
  );
}
