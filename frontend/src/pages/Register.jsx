import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await register(form);
      navigate("/perfil");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="panel auth-card" onSubmit={onSubmit}>
        <h2>Crear cuenta</h2>
        <p className="muted">La contraseña debe tener mínimo 8 caracteres, una letra y un número.</p>
        {error && <div className="alert">{error}</div>}
        <div className="field">
          <label>Nombre</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="field">
          <label>Correo electrónico</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div className="field">
          <label>Contraseña</label>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </div>
        <button className="btn" type="submit">Registrarme</button>
        <p className="muted">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </form>
    </div>
  );
}
