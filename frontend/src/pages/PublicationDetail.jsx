import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, formatDate } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { ConfirmDialog, Notice, PageHeading } from "../components/AcademicUI";
import BrandLoader from "../components/BrandLoader";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Field from "../components/ui/Field";
import Select from "../components/ui/Select";
import Textarea from "../components/ui/Textarea";

const REASONS = [
  "Contenido inapropiado",
  "Información incorrecta",
  "Incumple las reglas",
  "Spam o publicidad",
  "Otro",
];

export default function PublicationDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const d = await api(`/api/publications/${id}`);
      setData(d);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function remove() {
    setIsDeleting(true);
    try {
      await api(`/api/publications/${id}`, { method: "DELETE" });
      navigate("/publicaciones");
    } catch (err) {
      setError(err.message);
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(false);
    }
  }

  async function report(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsReporting(true);
    try {
      await api(`/api/publications/${id}/report`, {
        method: "POST",
        body: JSON.stringify({ reason, details }),
      });
      setMessage("Reporte registrado.");
      setDetails("");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsReporting(false);
    }
  }

  if (loading) return <BrandLoader variant="page" message="Cargando publicación..." />;
  if (!data) return <Notice error={error || "No se pudo cargar la publicación."} retry={load} />;

  const p = data.publication;

  return (
    <div className="space-y-6">
      <PageHeading eyebrow="Recursos académicos" title={p.title}>
        <Link to="/publicaciones">
          <Button variant="secondary">Volver al listado</Button>
        </Link>
      </PageHeading>

      <Notice error={error} message={message} retry={error ? load : undefined} />

      <Card>
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 font-medium text-indigo-700">
            {p.subject_name}
          </span>
          <span>·</span>
          <span>{p.author_name}</span>
          <span>·</span>
          <span>{formatDate(p.created_at)}</span>
        </div>
        <div className="mt-4 space-y-4">
          <p className="whitespace-pre-wrap leading-7 text-slate-700">{p.description}</p>
          {p.content && <p className="whitespace-pre-wrap leading-7 text-slate-600">{p.content}</p>}
          {p.fileUrl && (
            <p>
              <a
                className="inline-flex items-center gap-1 font-semibold text-indigo-600 underline hover:text-indigo-700"
                href={p.fileUrl}
                target="_blank"
                rel="noreferrer"
              >
                Descargar archivo ({p.original_name})
              </a>
            </p>
          )}
        </div>
        {p.user_id === user.id && (
          <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
            <Link to={`/publicaciones/${id}/editar`}>
              <Button variant="secondary">Editar</Button>
            </Link>
            <Button variant="danger" onClick={() => setShowDeleteDialog(true)}>
              Eliminar
            </Button>
          </div>
        )}
      </Card>

      {p.user_id !== user.id && !data.alreadyReported && (
        <Card>
          <h3 className="text-lg font-bold text-slate-900">Reportar publicación</h3>
          <form className="mt-4 space-y-4" onSubmit={report}>
            <Field label="Motivo">
              <Select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                options={REASONS.map((r) => ({ value: r, label: r }))}
                placeholder={null}
              />
            </Field>
            <Field label="Detalle">
              <Textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Describe por qué reportas este recurso..."
                rows={4}
              />
            </Field>
            <div className="flex justify-end">
              <Button type="submit" variant="danger" loading={isReporting}>
                Enviar reporte
              </Button>
            </div>
          </form>
        </Card>
      )}

      {data.alreadyReported && (
        <Notice message="Ya tienes un reporte activo sobre esta publicación." />
      )}

      <ConfirmDialog
        open={showDeleteDialog}
        title="Eliminar publicación"
        confirmLabel="Eliminar"
        busy={isDeleting}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={remove}
      >
        <p>¿Estás seguro de que deseas eliminar esta publicación? Esta acción no se puede deshacer.</p>
      </ConfirmDialog>
    </div>
  );
}
