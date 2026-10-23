import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Home() {
  const { user } = useAuth();
  return (
    <>
      <section className="hero">
        <div>
          <p className="muted" style={{ color: "#f5d76e" }}>Universidad Surcolombiana</p>
          <h1>Conecta estudiantes que necesitan apoyo con quienes pueden ofrecerlo.</h1>
          <p>
            StudyMatch es la plataforma para publicar solicitudes de ayuda, encontrar asesores por materia,
            acordar sesiones y compartir trabajos académicos.
          </p>
          <div className="row">
            <Link className="btn gold" to="/asesores">Buscar asesores</Link>
            <Link className="btn secondary" to="/solicitudes">Publicar solicitud</Link>
          </div>
        </div>
        <div className="panel">
          <h3>Hola, {user.name}</h3>
          <p className="muted">Puedes actuar como solicitante y como asesor con la misma cuenta.</p>
          <ul>
            <li>Completa tu perfil académico</li>
            <li>Indica las materias que dominas</li>
            <li>Publica o responde solicitudes</li>
            <li>Valora las asesorías finalizadas</li>
          </ul>
        </div>
      </section>
      <div className="space" />
      <div className="grid">
        {[
          ["Solicitudes", "Publica en qué materia necesitas refuerzo y un horario preferido."],
          ["Asesores", "Busca estudiantes disponibles y consulta su valoración promedio."],
          ["Publicaciones", "Comparte apuntes o trabajos y reporta contenido inadecuado."],
        ].map(([title, text]) => (
          <article className="card" key={title}>
            <h3>{title}</h3>
            <p className="muted">{text}</p>
          </article>
        ))}
      </div>
    </>
  );
}
