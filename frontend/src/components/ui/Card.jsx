export default function Card({ children, className = "", hover = false }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 ${
        hover ? "transition hover:-translate-y-1 hover:shadow-lg" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
