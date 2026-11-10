import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ArrowLeft, GraduationCap, Lock, Mail, UserRound, UserPlus } from "lucide-react";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    const normalizedEmail = form.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setEmailError("Ingresa un correo electrónico válido.");
      return;
    }
    setEmailError("");
    try {
      await register({ ...form, email: normalizedEmail });
      navigate("/perfil");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <form className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl sm:p-10" onSubmit={onSubmit}>
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><GraduationCap size={30} /></div>
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900">Crea tu cuenta</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Únete a la comunidad de apoyo académico.</p>
        </div>
        {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        <div className="space-y-5">
          <div><label className="mb-2 block text-sm font-semibold text-slate-700">Nombre completo</label><div className="relative"><UserRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div></div>
          <div><label className="mb-2 block text-sm font-semibold text-slate-700">Correo electrónico</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input className={`w-full rounded-xl border py-3 pl-10 pr-3 outline-none focus:ring-2 focus:ring-indigo-500/20 ${emailError ? "border-red-300 focus:border-red-500" : "border-slate-300 focus:border-indigo-500"}`} type="email" placeholder="nombre@ejemplo.com" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); setEmailError(""); }} required /></div>{emailError && <p className="mt-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{emailError}</p>}</div>
          <div><label className="mb-2 block text-sm font-semibold text-slate-700">Contraseña</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" type="password" placeholder="Mínimo 8 caracteres" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></div><p className="mt-2 text-xs text-slate-500">Usa al menos 8 caracteres, una letra y un número.</p></div>
        </div>
        <button className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2" type="submit"><UserPlus size={18} /> Registrarme</button>
        <p className="mt-6 text-center text-sm text-slate-500"><Link className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-700" to="/login"><ArrowLeft size={15} /> Volver a iniciar sesión</Link></p>
      </form>
    </div>
  );
}
