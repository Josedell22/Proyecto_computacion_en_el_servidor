import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatDate } from "../api/client";
import { AlertTriangle, Download, File, FileImage, FileText, Search } from "lucide-react";
import { Empty, Notice, PageHeading } from "../components/AcademicUI";
import BrandLoader from "../components/BrandLoader";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";

function FileIcon({ name }) {
  const extension = name?.split(".").pop()?.toLowerCase();
  if (["png", "jpg", "jpeg"].includes(extension)) return <FileImage size={23} />;
  if (["pdf", "doc", "docx"].includes(extension)) return <FileText size={23} />;
  return <File size={23} />;
}

export default function Publications() {
  const [items, setItems] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [q, setQ] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(term = q, subject = subjectId) {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams();
      if (term) qs.set("q", term);
      if (subject) qs.set("subjectId", subject);
      const data = await api(`/api/publications?${qs.toString()}`);
      setItems(data.publications);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api("/api/subjects").then((d) => setSubjects(d.subjects));
    load("", "");
  }, []);

  const subjectOptions = [
    { value: "", label: "Todas las materias" },
    ...subjects.map((s) => ({ value: String(s.id), label: s.name })),
  ];

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Comparte conocimiento"
        title="Publicaciones"
        description="Encuentra guías y apuntes compartidos por la comunidad."
      >
        <Link to="/publicaciones/nueva">
          <Button>+ Nueva publicación</Button>
        </Link>
      </PageHeading>
      <Notice error={error} retry={() => load()} />
      <form
        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-end"
        onSubmit={(e) => { e.preventDefault(); load(); }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
          <Input
            className="pl-10"
            placeholder="Buscar por título o materia"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          options={subjectOptions}
          placeholder={null}
          className="md:w-56"
        />
        <Button variant="secondary" type="submit">Buscar</Button>
      </form>
      {loading ? (
        <BrandLoader variant="inline" message="Cargando publicaciones..." />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.length === 0 && (
            <Empty icon={FileText} title="No hay publicaciones disponibles">
              Sé el primero en compartir un recurso académico con la comunidad.
            </Empty>
          )}
          {items.map((p) => (
            <Card key={p.id} className="flex flex-col hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <FileIcon name={p.original_name} />
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">Máx. 5 MB</span>
              </div>
              <h2 className="mt-5 text-lg font-bold text-slate-900">{p.title}</h2>
              <p className="mt-1 text-sm text-indigo-600">{p.subject_name}</p>
              <p className="mt-3 line-clamp-3 leading-6 text-slate-600">{p.description}</p>
              <p className="mt-4 text-xs text-slate-500">Por {p.author_name} · {formatDate(p.created_at)}</p>
              {p.original_name && <p className="mt-2 truncate text-xs text-slate-500">Archivo: {p.original_name}</p>}
              <div className="mt-auto flex flex-wrap gap-2 pt-5">
                <Link to={`/publicaciones/${p.id}`} className="flex-1">
                  <Button className="w-full">Ver detalle</Button>
                </Link>
                {p.fileUrl && (
                  <a
                    className="inline-flex items-center justify-center rounded-xl bg-emerald-50 px-3 py-2 text-emerald-700 hover:bg-emerald-100"
                    href={p.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                    aria-label="Descargar archivo"
                  >
                    <Download size={17} />
                  </a>
                )}
                <Link
                  className="inline-flex items-center justify-center rounded-xl bg-amber-50 px-3 py-2 text-amber-700 hover:bg-amber-100"
                  to={`/publicaciones/${p.id}`}
                  aria-label="Reportar publicación"
                >
                  <AlertTriangle size={17} />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
