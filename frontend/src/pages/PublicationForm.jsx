import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { Notice, PageHeading } from "../components/AcademicUI";
import BrandLoader from "../components/BrandLoader";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Field from "../components/ui/Field";
import Input from "../components/ui/Input";
import SubjectSelect from "../components/ui/SubjectSelect";
import Textarea from "../components/ui/Textarea";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
];
const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg"];

function validateFile(file) {
  if (!file) return "";
  if (file.size > MAX_FILE_SIZE) return "El archivo supera los 5 MB permitidos.";
  if (!ALLOWED_TYPES.includes(file.type)) {
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) return "Formato no válido. Usa PDF, DOC, DOCX, PNG o JPG.";
  }
  return "";
}

export default function PublicationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingPublication, setLoadingPublication] = useState(Boolean(id));
  const [form, setForm] = useState({ title: "", description: "", content: "", subjectId: "" });
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoadingSubjects(true);
    api("/api/subjects", { signal: controller.signal })
      .then((d) => { if (!controller.signal.aborted) setSubjects(d.subjects); })
      .catch((err) => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoadingSubjects(false); });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    setLoadingPublication(true);
    api(`/api/publications/${id}`, { signal: controller.signal })
      .then((d) => {
        if (controller.signal.aborted) return;
        setForm({
          title: d.publication.title,
          description: d.publication.description,
          content: d.publication.content || "",
          subjectId: String(d.publication.subject_id),
        });
      })
      .catch((err) => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoadingPublication(false); });
    return () => controller.abort();
  }, [id]);

  function handleFileChange(e) {
    const selected = e.target.files[0] || null;
    setFile(selected);
    setFileError(validateFile(selected));
  }

  async function save(e) {
    e.preventDefault();
    setError("");
    const fileValidation = validateFile(file);
    if (fileValidation) {
      setFileError(fileValidation);
      return;
    }
    setIsSubmitting(true);
    const body = new FormData();
    body.append("title", form.title);
    body.append("description", form.description);
    body.append("content", form.content);
    body.append("subjectId", form.subjectId);
    if (file) body.append("file", file);
    try {
      if (id) {
        await api(`/api/publications/${id}`, { method: "PUT", body });
        navigate(`/publicaciones/${id}`);
      } else {
        const created = await api("/api/publications", { method: "POST", body });
        navigate(`/publicaciones/${created.publication.id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const title = id ? "Editar publicación" : "Crear publicación";
  const description = id
    ? "Actualiza el recurso académico para la comunidad."
    : "Comparte apuntes, guías o parciales con otros estudiantes.";

  if (loadingPublication) {
    return <BrandLoader variant="page" message="Cargando publicación..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeading eyebrow="Recursos académicos" title={title} description={description} />
      <Notice error={error} />
      <Card>
        <form className="space-y-5" onSubmit={save}>
          <Field label="Título">
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ej: Guía de matrices y determinantes"
              required
            />
          </Field>
          <SubjectSelect
            subjects={subjects}
            value={form.subjectId}
            onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
            required
            label="Materia"
            placeholder={loadingSubjects ? "Cargando materias..." : "Seleccione una materia"}
          />
          <Field label="Descripción">
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Resume el contenido del recurso..."
              required
              rows={4}
            />
          </Field>
          <Field label="Contenido">
            <Textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Puedes agregar explicaciones, enlaces o notas adicionales (opcional)."
              rows={6}
            />
          </Field>
          <Field label="Archivo (PDF, DOC, DOCX, PNG, JPG · máx. 5 MB)" error={fileError}>
            <Input
              type="file"
              accept={ALLOWED_EXTENSIONS.join(",")}
              onChange={handleFileChange}
            />
          </Field>
          {file && (
            <p className="text-sm text-slate-600">
              Archivo seleccionado: <span className="font-medium">{file.name}</span>{" "}
              ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              type="button"
              onClick={() => navigate("/publicaciones")}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={loadingSubjects}>
              {id ? "Guardar cambios" : "Publicar recurso"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
