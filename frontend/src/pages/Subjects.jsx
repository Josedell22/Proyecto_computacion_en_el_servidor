import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { BookOpen, Check, Pencil, Plus, Power, Search, Trash2, X } from "lucide-react";
import { ConfirmDialog, Notice, PageHeading } from "../components/AcademicUI";
import BrandLoader from "../components/BrandLoader";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Field from "../components/ui/Field";
import Input from "../components/ui/Input";
import Textarea from "../components/ui/Textarea";

const emptyForm = { name: "", description: "" };

export default function Subjects() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [q, setQ] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  async function load(term = q) {
    setLoading(true);
    try {
      const data = await api(`/api/subjects?q=${encodeURIComponent(term)}${user.role === "admin" ? "&all=1" : ""}`);
      setSubjects(data.subjects);
      setMessage(data.message || "");
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load("");
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  }

  function openEdit(subject) {
    setEditing(subject);
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
  }

  async function createSubject(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/subjects", { method: "POST", body: JSON.stringify(form) });
      closeModal();
      await load("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggle(subject) {
    setBusy(true);
    setError("");
    try {
      await api(`/api/subjects/${subject.id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: !subject.is_active }),
      });
      await load("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function updateSubject(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(`/api/subjects/${editing.id}`, {
        method: "PUT",
        body: JSON.stringify({ name: editing.name, description: editing.description, isActive: editing.is_active }),
      });
      closeModal();
      await load("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeSubject() {
    if (!confirmDelete) return;
    setBusy(true);
    setError("");
    try {
      await api(`/api/subjects/${confirmDelete.id}`, { method: "DELETE" });
      setConfirmDelete(null);
      await load("");
    } catch (err) {
      setError(err.message);
      setConfirmDelete(null);
    } finally {
      setBusy(false);
    }
  }

  const isEditing = Boolean(editing);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Catálogo académico</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Materias</h1>
          <p className="mt-2 text-slate-600">
            {user.role === "admin"
              ? "Crea, modifica o desactiva las asignaturas disponibles para la comunidad."
              : "Consulta las asignaturas activas en las que puedes pedir o ofrecer asesoría."}
          </p>
        </div>
        {user.role === "admin" && (
          <Button onClick={openCreate} type="button">
            <Plus size={18} /> Nueva materia
          </Button>
        )}
      </div>

      <Notice error={error} message={message} retry={error ? () => load("") : undefined} />

      <form
        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          load(q);
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            className="pl-10"
            placeholder="Buscar por nombre"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Button variant="secondary" type="submit">
          Buscar
        </Button>
      </form>

      {loading ? (
        <BrandLoader variant="inline" message="Cargando materias..." />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {subjects.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 md:col-span-2 lg:col-span-3">
              No hay materias para mostrar.
            </div>
          )}
          {subjects.map((subject) => (
            <Card hover key={subject.id} className="flex min-h-56 flex-col">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <BookOpen size={22} />
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    subject.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {subject.is_active ? "Activa" : "Desactivada"}
                </span>
              </div>
              <h2 className="mt-5 text-lg font-bold text-slate-900">{subject.name}</h2>
              <p className="mt-2 flex-1 leading-6 text-slate-600">
                {subject.description || "Sin descripción disponible."}
              </p>
              {user.role === "admin" && (
                <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  <Button
                    variant="secondary"
                    className="flex-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                    onClick={() => openEdit(subject)}
                    type="button"
                  >
                    <Pencil size={15} /> Editar
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1 bg-slate-100 text-slate-600 hover:bg-slate-200"
                    onClick={() => toggle(subject)}
                    type="button"
                    loading={busy}
                  >
                    <Power size={15} /> {subject.is_active ? "Desactivar" : "Activar"}
                  </Button>
                  {subject.is_active && (
                    <Button
                      variant="danger"
                      className="bg-red-50 px-3 text-red-600 hover:bg-red-100"
                      onClick={() => setConfirmDelete(subject)}
                      type="button"
                      aria-label={`Eliminar ${subject.name}`}
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {modalOpen && user.role === "admin" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="subject-modal-title"
        >
          <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Catálogo académico</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900" id="subject-modal-title">
                  {isEditing ? "Editar materia" : "Nueva materia"}
                </h2>
              </div>
              <button
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                onClick={closeModal}
                type="button"
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={isEditing ? updateSubject : createSubject}>
              <div className="space-y-5">
                <Field label="Nombre" htmlFor="subject-name">
                  <Input
                    id="subject-name"
                    value={isEditing ? editing.name : form.name}
                    onChange={(e) =>
                      isEditing
                        ? setEditing({ ...editing, name: e.target.value })
                        : setForm({ ...form, name: e.target.value })
                    }
                    required
                  />
                </Field>
                <Field label="Descripción" htmlFor="subject-description">
                  <Textarea
                    id="subject-description"
                    value={isEditing ? editing.description || "" : form.description}
                    onChange={(e) =>
                      isEditing
                        ? setEditing({ ...editing, description: e.target.value })
                        : setForm({ ...form, description: e.target.value })
                    }
                    rows={5}
                  />
                </Field>
              </div>
              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button variant="secondary" type="button" onClick={closeModal} disabled={busy}>
                  Cancelar
                </Button>
                <Button type="submit" loading={busy}>
                  <Check size={17} /> Guardar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Eliminar materia"
        confirmLabel="Eliminar"
        busy={busy}
        onClose={() => setConfirmDelete(null)}
        onConfirm={removeSubject}
      >
        <p>
          ¿Estás seguro de que deseas eliminar la materia <strong>{confirmDelete?.name}</strong>? Esta acción no se
          puede deshacer.
        </p>
      </ConfirmDialog>
    </div>
  );
}
