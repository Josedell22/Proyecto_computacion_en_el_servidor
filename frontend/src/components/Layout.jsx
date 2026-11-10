import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import BrandLogo from "./BrandLogo";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [
    ["/", "Inicio"], ["/solicitudes", "Solicitudes"], ["/asesores", "Asesores"],
    ["/materias", "Materias"], ["/disponibilidad", "Horarios"], ["/sesiones", "Sesiones"],
    ["/historial", "Historial"], ["/publicaciones", "Publicaciones"], ["/perfil", "Perfil"],
  ];
  if (user?.role === "admin") links.push(["/admin", "Administración"]);

  return (
    <>
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-white focus:p-4">Ir al contenido</a>
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-900 text-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-3">
            <NavLink className="flex shrink-0 items-center gap-2 text-xl font-extrabold tracking-tight text-white" to="/" onClick={() => setMenuOpen(false)}>
              <BrandLogo className="h-8 w-8" ariaLabel="StudyMatch" /><span>StudyMatch</span>
            </NavLink>
            <div className="flex min-w-0 items-center gap-3">
              <span className="hidden max-w-52 truncate text-sm text-slate-300 sm:block">{user?.name}</span>
              <button className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 hover:text-white" onClick={() => { logout(); navigate("/login"); }} type="button" aria-label="Cerrar sesión"><LogOut size={20} /></button>
              <button className="rounded-lg p-2 text-slate-300 hover:bg-slate-800 lg:hidden" onClick={() => setMenuOpen(!menuOpen)} type="button" aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} aria-expanded={menuOpen} aria-controls="navegacion">
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
          <nav id="navegacion" aria-label="Navegación principal" className={(menuOpen ? "flex " : "hidden ") + "max-h-[70vh] flex-col gap-1 overflow-y-auto border-t border-slate-800 py-3 lg:flex lg:flex-row lg:flex-wrap lg:py-2"}>
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === "/"} onClick={() => setMenuOpen(false)} className={({ isActive }) => "rounded-lg px-3 py-2 text-sm transition " + (isActive ? "bg-indigo-500/20 font-semibold text-indigo-200" : "text-slate-300 hover:bg-slate-800 hover:text-white")}>{label}</NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main id="contenido" className="min-h-[calc(100vh-64px)] bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><Outlet /></div>
      </main>
    </>
  );
}
