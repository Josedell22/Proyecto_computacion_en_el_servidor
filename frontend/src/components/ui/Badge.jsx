const variants = {
  pending: "bg-amber-50 text-amber-700",
  accepted: "bg-emerald-50 text-emerald-700",
  confirmed: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  cancelled: "bg-red-50 text-red-700",
  finished: "bg-indigo-50 text-indigo-700",
};

export default function Badge({ children, status, className = "" }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
        variants[status] || "bg-slate-100 text-slate-600"
      } ${className}`}
    >
      {children}
    </span>
  );
}
