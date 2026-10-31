import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { GraduationCap, Lock, LogIn, Mail } from "lucide-react";

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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <form className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl sm:p-10" onSubmit={onSubmit}>
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><GraduationCap size={30} /></div>
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900">Bienvenido a StudyMatch</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Inicia sesión con tu correo institucional.</p>
        </div>
        {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        <div className="space-y-5">
          <div><label className="mb-2 block text-sm font-semibold text-slate-700">Correo electrónico</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" type="email" placeholder="nombre@usco.edu.co" value={email} onChange={(e) => setEmail(e.target.value)} required /></div></div>
          <div><label className="mb-2 block text-sm font-semibold text-slate-700">Contraseña</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" type="password" placeholder="Tu contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required /></div></div>
        </div>
        <button className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" type="submit"><LogIn size={18} /> Ingresar</button>
        <p className="mt-6 text-center text-sm text-slate-500">¿Aún no tienes cuenta? <Link className="font-semibold text-indigo-600 hover:text-indigo-700" to="/registro">Regístrate</Link></p>
      </form>
    </div>
  );
}
