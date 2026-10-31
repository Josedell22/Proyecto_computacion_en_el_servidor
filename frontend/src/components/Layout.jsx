import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { GraduationCap, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    ["/", "Inicio"],
    ["/solicitudes", "Solicitudes"],
    ["/asesores", "Asesores"],
    ["/publicaciones", "Publicaciones"],
    ["/perfil", "Perfil"],
  ];
  if (user?.role === "admin") links.push(["/admin", "Administración"]);

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-900 text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-4 py-3 sm:px-6 lg:px-8">
          <NavLink className="flex shrink-0 items-center gap-2 text-xl font-extrabold tracking-tight text-white" to="/" onClick={() => setMenuOpen(false)}>
            <GraduationCap className="text-indigo-400" size={27} />
            <span>StudyMatch</span>
          </NavLink>
          <button className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 lg:hidden" onClick={() => setMenuOpen((open) => !open)} type="button" aria-label="Abrir menú">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className={`${menuOpen ? "flex" : "hidden"} absolute left-0 right-0 top-full flex-col gap-3 border-b border-slate-800 bg-slate-900 p-4 lg:static lg:flex lg:flex-1 lg:flex-row lg:items-center lg:justify-end lg:border-0 lg:bg-transparent lg:p-0`}>
            <nav className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-1">
              {links.map(([to, label]) => (
                <NavLink
                  className={({ isActive }) => `rounded-lg px-3 py-1.5 text-sm transition ${isActive ? "border border-indigo-500/30 bg-indigo-600/30 font-medium text-indigo-300" : "border border-transparent text-slate-300 hover:text-white"}`}
                  key={to}
                  to={to}
                  end={to === "/"}
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </NavLink>
              ))}
            </nav>
            <div className="flex items-center justify-between gap-3 border-t border-slate-800 pt-3 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 font-bold text-white ring-2 ring-indigo-500/50">{user?.name?.charAt(0)?.toUpperCase()}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-300">{user?.role === "admin" ? "Admin" : "Estudiante"}</span>
                </div>
              </div>
              <button className="inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white" onClick={() => { logout(); navigate("/login"); }} type="button">
                <LogOut size={16} />
                <span className="hidden xl:inline">Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="min-h-[calc(100vh-65px)] bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
        </div>
      </main>
    </>
  );
}
