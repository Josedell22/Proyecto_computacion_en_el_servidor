import { useEffect, useRef } from "react";
import BrandLoader from "./BrandLoader";

export const primaryButton = "inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700";
export const secondaryButton = "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50";
export const panel = "min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6";

export function PageHeading({ eyebrow, title, description, children }) {
  return <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
    <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-widest text-indigo-600">{eyebrow}</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p></div>
    {children}
  </div>;
}

export function Notice({ error, message, retry }) {
  if (!error && !message) return null;
  return <div role={error ? "alert" : "status"} className={"rounded-xl border p-4 text-sm " + (error ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800")}>
    {error || message}
    {error && retry && <button type="button" className="ml-3 font-semibold underline" onClick={retry}>Reintentar</button>}
  </div>;
}

export function Loading() {
  return <BrandLoader variant="inline" message="Cargando..." />;
}

export function Empty({ icon: Icon, title, children }) {
  return <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
    <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500"><Icon size={24} /></span>
    <h2 className="font-semibold text-slate-900">{title}</h2><div className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{children}</div>
  </div>;
}

export function ConfirmDialog({ open, title, children, confirmLabel = "Confirmar", busy, onConfirm, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    if (open && !ref.current.open) ref.current.showModal();
    if (!open && ref.current.open) ref.current.close();
  }, [open]);
  return <dialog ref={ref} aria-labelledby="confirm-title" className="w-[calc(100%-2rem)] max-w-md rounded-2xl border-0 bg-white p-6 shadow-xl backdrop:bg-slate-950/50" onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    <h2 id="confirm-title" className="text-xl font-bold text-slate-900">{title}</h2>
    <div className="my-5 space-y-4 text-sm leading-6 text-slate-600">{children}</div>
    <div className="flex flex-wrap justify-end gap-2"><button type="button" className={secondaryButton} onClick={onClose} disabled={busy}>Volver</button><button type="button" className={primaryButton} onClick={onConfirm} disabled={busy}>{busy ? "Guardando..." : confirmLabel}</button></div>
  </dialog>;
}
