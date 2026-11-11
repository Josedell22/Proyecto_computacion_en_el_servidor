import React, { useId } from "react";

export default function Field({ label, children, hint, error, htmlFor, className = "" }) {
  const generatedId = useId();
  const id = htmlFor || generatedId;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const child = React.Children.only(children);
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined;

  const control = React.cloneElement(child, {
    id,
    "aria-invalid": Boolean(error),
    "aria-describedby": describedBy,
  });

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
          {label}
        </label>
      )}
      {control}
      {hint && (
        <p id={hintId} className="text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
