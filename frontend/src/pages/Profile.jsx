import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Check, GraduationCap, Save, UserRound } from "lucide-react";
import { Loading, Notice, PageHeading } from "../components/AcademicUI";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Field from "../components/ui/Field";
import Input from "../components/ui/Input";
import Textarea from "../components/ui/Textarea";

export default function Profile() {
  const { refresh } = useAuth();
  const [data, setData] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selected, setSelected] = useState([]);
  const [form, setForm] = useState({ name: "", program: "", semester: "", bio: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSubjects, setSavingSubjects] = useState(false);

  async function load(signal) {
    setLoading(true);
    try {
      const [profile, catalog] = await Promise.all([
        api("/api/profile", { signal }),
        api("/api/subjects", { signal }),
      ]);
      if (signal?.aborted) return;
      setData(profile);
      setForm({
        name: profile.user.name || "",
        program: profile.user.program || "",
        semester: profile.user.semester || "",
        bio: profile.user.bio || "",
      });
      setSelected(profile.subjects.map((s) => s.id));
      setSubjects(catalog.subjects);
      setError("");
    } catch (err) {
      if (!signal?.aborted) setError(err.message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, []);

  async function saveProfile(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSavingProfile(true);
    try {
      const result = await api("/api/profile", { method: "PUT", body: JSON.stringify(form) });
      setData(result);
      await refresh();
      setMessage("Perfil actualizado.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveSubjects(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSavingSubjects(true);
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
    } finally {
      setSavingSubjects(false);
    }
  }

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Tu identidad académica"
        title="Perfil"
        description="Mantén actualizada tu información para conectar mejor con la comunidad."
      />
      <Notice error={error} message={message} retry={error ? load : undefined} />
      <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-800">
        {data.profile.message}
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <form onSubmit={saveProfile}>
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <UserRound size={21} />
              </span>
              <div>
                <h2 className="font-bold text-slate-900">Datos personales</h2>
                <p className="text-sm text-slate-500">Información básica y académica</p>
              </div>
            </div>
            <div className="space-y-4">
              <Field label="Nombre" htmlFor="profile-name">
                <Input
                  id="profile-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </Field>
              <Field label="Programa académico" htmlFor="profile-program">
                <Input
                  id="profile-program"
                  value={form.program}
                  onChange={(e) => setForm({ ...form, program: e.target.value })}
                />
              </Field>
              <Field label="Semestre" htmlFor="profile-semester">
                <Input
                  id="profile-semester"
                  type="number"
                  min="1"
                  max="20"
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: e.target.value })}
                />
              </Field>
              <Field label="Descripción personal" htmlFor="profile-bio">
                <Textarea
                  id="profile-bio"
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={5}
                />
              </Field>
            </div>
            <Button
              type="submit"
              className="mt-6 bg-indigo-600 hover:bg-indigo-700"
              loading={savingProfile}
            >
              <Save size={17} /> Guardar perfil
            </Button>
          </form>
        </Card>
        <Card className="lg:col-span-7">
          <form onSubmit={saveSubjects}>
            <div className="mb-2 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <GraduationCap size={21} />
              </span>
              <div>
                <h2 className="font-bold text-slate-900">Materias a asesorar</h2>
                <p className="text-sm text-slate-500">Selecciona las materias en las que puedes ayudar.</p>
              </div>
            </div>
            <p className="mb-6 mt-4 text-sm leading-6 text-slate-600">
              Solo estudiantes con dominio registrado pueden ofrecer asesoría en esa materia.
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {subjects.map((s) => {
                const isSelected = selected.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                        : "border-slate-200 text-slate-700 hover:border-indigo-500"
                    }`}
                  >
                    <span className="font-medium">{s.name}</span>
                    <input
                      className="sr-only"
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) =>
                        setSelected((prev) =>
                          e.target.checked ? [...prev, s.id] : prev.filter((id) => id !== s.id)
                        )
                      }
                    />
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                        isSelected ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300"
                      }`}
                    >
                      {isSelected && <Check size={13} />}
                    </span>
                  </label>
                );
              })}
            </div>
            <Button
              type="submit"
              className="mt-6 bg-emerald-600 hover:bg-emerald-700"
              loading={savingSubjects}
            >
              <Save size={17} /> Guardar materias
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
