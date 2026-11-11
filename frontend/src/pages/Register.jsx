import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ArrowLeft, GraduationCap, Lock, Mail, UserRound, UserPlus } from "lucide-react";
import Button from "../components/ui/Button";
import Field from "../components/ui/Field";
import Input from "../components/ui/Input";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    const normalizedEmail = form.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setEmailError("Ingresa un correo electrónico válido.");
      return;
    }
    setEmailError("");
    setBusy(true);
    try {
      await register({ ...form, email: normalizedEmail });
      navigate("/perfil");
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
          <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900">Crea tu cuenta</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Únete a la comunidad de apoyo académico.</p>
        </div>
        {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        <div className="space-y-5">
          <Field label="Nombre completo" htmlFor="register-name">
            <Input
              id="register-name"
              startIcon={<UserRound size={18} />}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </Field>
          <Field label="Correo electrónico" htmlFor="register-email" error={emailError}>
            <Input
              id="register-email"
              className={emailError ? "border-red-300 focus:border-red-500 focus:ring-red-500/20" : ""}
              type="email"
              startIcon={<Mail size={18} />}
              placeholder="nombre@ejemplo.com"
              value={form.email}
              onChange={(e) => { setForm({ ...form, email: e.target.value }); setEmailError(""); }}
              required
            />
          </Field>
          <Field label="Contraseña" htmlFor="register-password" hint="Usa al menos 8 caracteres, una letra y un número.">
            <Input
              id="register-password"
              type="password"
              startIcon={<Lock size={18} />}
              placeholder="Mínimo 8 caracteres"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </Field>
        </div>
        <Button type="submit" className="mt-7 w-full" loading={busy}>
          <UserPlus size={18} /> Registrarme
        </Button>
        <p className="mt-6 text-center text-sm text-slate-500"><Link className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-700" to="/login"><ArrowLeft size={15} /> Volver a iniciar sesión</Link></p>
      </form>
    </div>
  );
}
