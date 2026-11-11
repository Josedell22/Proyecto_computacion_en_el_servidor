import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CalendarCheck, CheckCircle2, Star } from "lucide-react";
import { api, formatDate, STATUS_LABEL } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useResource } from "../hooks/useResource";
import { ConfirmDialog, Empty, Loading, Notice, PageHeading } from "../components/AcademicUI";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Field from "../components/ui/Field";
import Textarea from "../components/ui/Textarea";

export default function Sessions() {
  const { user } = useAuth();
  const { hash } = useLocation();
  const resource = useResource("/api/sessions");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState({});
  const [busy, setBusy] = useState(null);
  const [finishing, setFinishing] = useState(null);
  const [filter, setFilter] = useState("all");
  const sessions = resource.data?.sessions || [];
  const visible = sessions.filter((s) => filter === "all" || s.status === filter);

  useEffect(() => {
    if (!resource.loading && hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: "center" });
  }, [resource.loading, hash]);

  async function finish() {
    if (busy || !finishing) return;
    setBusy(finishing.id); setError("");
    try {
      await api("/api/sessions/" + finishing.id + "/finish", { method: "PATCH" });
      setFinishing(null); setMessage("Sesión finalizada. El solicitante ya puede valorar la asesoría."); resource.reload();
    } catch (err) { setError(err.message); }
    finally { setBusy(null); }
  }

  async function rate(event, id) {
    event.preventDefault();
    if (busy) return;
    setBusy(id); setError(""); setMessage("");
    try {
      await api("/api/sessions/" + id + "/rating", {
        method: "POST", body: JSON.stringify({ stars: rating[id]?.stars ?? 5, comment: rating[id]?.comment ?? "" }),
      });
      setMessage("Gracias por tu valoración. Ya está incluida en el promedio del asesor."); resource.reload();
    } catch (err) { setError(err.message); if (err.status === 409) resource.reload(); }
    finally { setBusy(null); }
  }

  function updateRating(id, patch) {
    setRating((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  }

  const filterOptions = [
    ["all", "Todas"],
    ["confirmed", "Confirmadas"],
    ["finished", "Finalizadas"],
  ];

  return (
    <div className="space-y-6">
      <PageHeading eyebrow="Aprende en compañía" title="Sesiones de asesoría" description="Aquí están tus encuentros confirmados y finalizados, tanto como solicitante como asesor.">
        <Link to="/historial">
          <Button variant="secondary" className="shrink-0">Ver historial</Button>
        </Link>
      </PageHeading>
      <Notice error={!finishing && (error || resource.error)} message={message} retry={resource.error ? resource.reload : undefined} />
      <div className="flex flex-wrap gap-2" aria-label="Filtrar sesiones">
        {filterOptions.map(([value, label]) => (
          <Button
            key={value}
            type="button"
            variant={value === filter ? "primary" : "secondary"}
            onClick={() => setFilter(value)}
            aria-pressed={value === filter}
          >
            {label}
            <span className="rounded-full bg-slate-500/10 px-2 py-0.5 text-xs">
              {value === "all" ? sessions.length : sessions.filter((s) => s.status === value).length}
            </span>
          </Button>
        ))}
      </div>
      {resource.loading ? (
        <Loading />
      ) : (
        !resource.error && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {!visible.length && (
              <Empty icon={CalendarCheck} title="Sin sesiones en esta vista">
                Las solicitudes aceptadas se convierten en sesiones. <Link className="font-semibold text-indigo-600" to="/solicitudes">Ver solicitudes</Link>
              </Empty>
            )}
            {visible.map((session) => {
              const isStudent = session.student_id === user.id;
              const selectedStars = rating[session.id]?.stars ?? 5;
              return (
                <Card key={session.id} id={"sesion-" + session.id} className="scroll-mt-36">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{isStudent ? "Como solicitante" : "Como asesor"}</p>
                      <h2 className="mt-2 break-words text-xl font-bold text-slate-900">{session.subject_name}</h2>
                    </div>
                    <Badge status={session.status}>{STATUS_LABEL[session.status]}</Badge>
                  </div>
                  <div className="mt-5 space-y-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                    <p className="flex items-center gap-2 font-semibold text-slate-800">
                      <CalendarCheck size={17} className="shrink-0 text-indigo-500" />{formatDate(session.scheduled_at)}
                    </p>
                    <p>Solicitante: <span className="text-slate-900">{session.student_name}</span></p>
                    <p>Asesor: <Link className="font-medium text-indigo-600 hover:underline" to={"/asesores/" + session.advisor_id}>{session.advisor_name}</Link></p>
                  </div>
                  {session.status === "confirmed" && (
                    <Button className="mt-5" disabled={!!busy} onClick={() => { setFinishing(session); setError(""); }} type="button">
                      <CheckCircle2 size={17} /> Marcar como finalizada
                    </Button>
                  )}
                  {session.status === "finished" && isStudent && !session.stars && (
                    <form className="mt-5 border-t border-slate-100 pt-5" onSubmit={(event) => rate(event, session.id)}>
                      <fieldset disabled={!!busy}>
                        <legend className="mb-2 font-bold text-slate-900">¿Cómo fue tu asesoría?</legend>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex gap-1" role="group" aria-label="Valoración de la asesoría">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                className="rounded-lg p-2 text-amber-500 hover:bg-amber-50"
                                key={star}
                                onClick={() => updateRating(session.id, { stars: star })}
                                type="button"
                                aria-pressed={selectedStars === star}
                                aria-label={star + " estrellas"}
                              >
                                <Star fill={star <= selectedStars ? "currentColor" : "none"} size={24} />
                              </button>
                            ))}
                          </div>
                          <span className="text-sm font-semibold text-slate-600">{selectedStars} de 5</span>
                        </div>
                        <Field label="Comentario (opcional)" htmlFor={"comment-" + session.id}>
                          <Textarea
                            id={"comment-" + session.id}
                            maxLength={800}
                            placeholder="Comparte qué te ayudó a aprender..."
                            value={rating[session.id]?.comment || ""}
                            onChange={(e) => updateRating(session.id, { comment: e.target.value })}
                            rows={3}
                          />
                        </Field>
                        <p className="mt-1 text-right text-xs text-slate-600">{rating[session.id]?.comment?.length || 0}/800</p>
                        <Button className="mt-3" type="submit" loading={busy === session.id}>
                          {busy === session.id ? "Enviando..." : "Enviar valoración"}
                        </Button>
                        <p className="mt-2 text-xs text-slate-500">Puedes valorar cada sesión una sola vez.</p>
                      </fieldset>
                    </form>
                  )}
                  {!!session.stars && (
                    <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50/60 p-4">
                      <div className="flex items-center gap-1 text-amber-500" aria-label={"Valoración: " + session.stars + " de 5"}>
                        {[1, 2, 3, 4, 5].map((star) => <Star fill={star <= session.stars ? "currentColor" : "none"} key={star} size={17} />)}
                        <span className="ml-2 text-sm font-semibold text-amber-800">{session.stars}/5</span>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{session.rating_comment || "Valoración sin comentario."}</p>
                    </div>
                  )}
                  {session.status === "finished" && !isStudent && !session.stars && (
                    <p className="mt-5 text-sm text-slate-500">Pendiente de valoración del solicitante.</p>
                  )}
                </Card>
              );
            })}
          </div>
        )
      )}
      <ConfirmDialog open={!!finishing} busy={!!busy} title="Finalizar asesoría" confirmLabel="Finalizar sesión" onConfirm={finish} onClose={() => { setFinishing(null); setError(""); }}>
        <p>Confirma que la asesoría de {finishing?.subject_name} ya terminó. Se guardará en el historial y el solicitante podrá valorarla.</p>
        <Notice error={error} />
      </ConfirmDialog>
    </div>
  );
}
