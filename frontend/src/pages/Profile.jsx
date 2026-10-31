import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Check, GraduationCap, Save, UserRound } from "lucide-react";

export default function Profile() {
  const { refresh } = useAuth();
  const [data, setData] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selected, setSelected] = useState([]);
  const [form, setForm] = useState({ name: "", program: "", semester: "", bio: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const [profile, catalog] = await Promise.all([api("/api/profile"), api("/api/subjects")]);
    setData(profile);
    setForm({
      name: profile.user.name || "",
      program: profile.user.program || "",
      semester: profile.user.semester || "",
      bio: profile.user.bio || "",
    });
    setSelected(profile.subjects.map((s) => s.id));
    setSubjects(catalog.subjects);
  }

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  async function saveProfile(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const result = await api("/api/profile", { method: "PUT", body: JSON.stringify(form) });
      setData(result);
      await refresh();
      setMessage("Perfil actualizado.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveSubjects(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const result = await api("/api/profile/subjects", {
        method: "PUT",
        body: JSON.stringify({ subjectIds: selected }),
      });
      setData(result);
      await refresh();
      setMessage("Materias dominadas actualizadas.");
    } catch (err) {
      setError(err.message);
    }
  }

  if (!data) return <p>Cargando perfil...</p>;

  return (
    <div className="space-y-6">
      <div><p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Tu identidad académica</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Perfil</h1><p className="mt-2 text-slate-600">Mantén actualizada tu información para conectar mejor con la comunidad.</p></div>
      {error && <div className="alert">{error}</div>}
      {message && <div className="ok">{message}</div>}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-800">{data.profile.message}</div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <form className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-5" onSubmit={saveProfile}>
          <div className="mb-6 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><UserRound size={21} /></span><div><h2 className="font-bold text-slate-900">Datos personales</h2><p className="text-sm text-slate-500">Información básica y académica</p></div></div>
          <div className="space-y-4">
            <div><label className="mb-2 block text-sm font-semibold text-slate-700">Nombre</label><input className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="mb-2 block text-sm font-semibold text-slate-700">Programa académico</label><input className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })} /></div>
            <div><label className="mb-2 block text-sm font-semibold text-slate-700">Semestre</label><input className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" type="number" min="1" max="20" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} /></div>
            <div><label className="mb-2 block text-sm font-semibold text-slate-700">Descripción personal</label><textarea className="min-h-28 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
          </div>
          <button className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-700" type="submit"><Save size={17} /> Guardar perfil</button>
        </form>
        <form className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-7" onSubmit={saveSubjects}>
          <div className="mb-2 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><GraduationCap size={21} /></span><div><h2 className="font-bold text-slate-900">Materias a asesorar</h2><p className="text-sm text-slate-500">Selecciona las materias en las que puedes ayudar.</p></div></div>
          <p className="mb-6 mt-4 text-sm leading-6 text-slate-600">Solo estudiantes con dominio registrado pueden ofrecer asesoría en esa materia.</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {subjects.map((s) => {
              const isSelected = selected.includes(s.id);
              return <label className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition ${isSelected ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-700 hover:border-indigo-500"}`} key={s.id}>
                <span className="font-medium">{s.name}</span><input className="sr-only" type="checkbox" checked={isSelected} onChange={(e) => setSelected((prev) => (e.target.checked ? [...prev, s.id] : prev.filter((id) => id !== s.id)))} /><span className={`flex h-5 w-5 items-center justify-center rounded-full border ${isSelected ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300"}`}>{isSelected && <Check size={13} />}</span>
              </label>;
            })}
          </div>
          <button className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-700" type="submit"><Save size={17} /> Guardar materias</button>
        </form>
      </div>
    </div>
  );
}
