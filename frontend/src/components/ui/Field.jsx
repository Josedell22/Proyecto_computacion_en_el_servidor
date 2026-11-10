import React, { useId } from "react";

export default function Field({ label, children, error, htmlFor, className = "" }) {
  const generatedId = useId();
  const id = htmlFor || generatedId;
  const errorId = `${id}-error`;

  const child = React.Children.only(children);
  const control = React.cloneElement(child, {
    id,
    "aria-invalid": Boolean(error),
    "aria-describedby": error ? errorId : undefined,
  });

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
          {label}
        </label>
      )}
      {control}
      {error && (
        <p id={errorId} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
