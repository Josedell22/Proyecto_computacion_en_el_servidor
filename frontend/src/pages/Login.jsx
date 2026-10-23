import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/panel");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="panel auth-card" onSubmit={onSubmit}>
        <h2>StudyMatch</h2>
        <p className="muted">Inicia sesión con tu correo institucional o de registro.</p>
        {error && <div className="alert">{error}</div>}
        <div className="field">
          <label>Correo electrónico</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label>Contraseña</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button className="btn" type="submit">Ingresar</button>
        <p className="muted">
          ¿Aún no tienes cuenta? <Link to="/registro">Regístrate</Link>
        </p>
      </form>
    </div>
  );
}
