import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ArrowLeft, GraduationCap, Lock, LogIn, Mail } from "lucide-react";
import Button from "../components/ui/Button";
import Field from "../components/ui/Field";
import Input from "../components/ui/Input";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      navigate("/panel");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <form className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl sm:p-10" onSubmit={onSubmit}>
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><GraduationCap size={30} /></div>
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900">Bienvenido a StudyMatch</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Inicia sesión con tu correo electrónico.</p>
        </div>
        {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        <div className="space-y-5">
          <Field label="Correo electrónico" htmlFor="login-email">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input
                id="login-email"
                className="pl-10"
                type="email"
                placeholder="nombre@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </Field>
          <Field label="Contraseña" htmlFor="login-password">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input
                id="login-password"
                className="pl-10"
                type="password"
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </Field>
        </div>
        <Button type="submit" className="mt-7 w-full" loading={busy}>
          <LogIn size={18} /> Ingresar
        </Button>
        <p className="mt-6 text-center text-sm text-slate-500">¿Aún no tienes cuenta? <Link className="font-semibold text-indigo-600 hover:text-indigo-700" to="/registro">Regístrate</Link></p>
      </form>
    </div>
  );
}
