const base =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-500";

export default function Select({ options = [], placeholder = "Seleccione", className = "", ...props }) {
  return (
    <select className={`${base} ${className}`} {...props}>
      {placeholder && (
        <option value="" disabled={props.required}>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
