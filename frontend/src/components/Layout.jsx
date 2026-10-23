import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = [
    ["/", "Inicio"],
    ["/panel", "Panel"],
    ["/perfil", "Perfil"],
    ["/materias", "Materias"],
    ["/solicitudes", "Solicitudes"],
    ["/asesores", "Asesores"],
    ["/disponibilidad", "Disponibilidad"],
    ["/sesiones", "Sesiones"],
    ["/historial", "Historial"],
    ["/publicaciones", "Publicaciones"],
  ];
  if (user?.role === "admin") links.push(["/admin", "Administración"]);

  return (
    <>
      <header className="topbar">
        <NavLink className="brand" to="/">
          StudyMatch
        </NavLink>
        <nav className="nav">
          {links.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === "/"}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="user-chip">
          <span>{user?.name}</span>
          <button
            className="ghost"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </header>
      <main className="page">
        <Outlet />
      </main>
    </>
  );
}
