const base =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-100 disabled:text-slate-500";

export default function Input({ className = "", startIcon, ...props }) {
  if (!startIcon) {
    return <input className={`${base} ${className}`} {...props} />;
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        {startIcon}
      </span>
      <input className={`${base} pl-10 ${className}`} {...props} />
    </div>
  );
}
