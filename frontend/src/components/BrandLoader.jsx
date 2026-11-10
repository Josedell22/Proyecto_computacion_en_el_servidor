import BrandLogo from "./BrandLogo";

export default function BrandLoader({ variant = "fullscreen", message = "Cargando..." }) {
  const isInline = variant === "inline";
  const spinner = (
    <div className={`relative flex items-center justify-center ${isInline ? "h-10 w-10" : "h-20 w-20"}`}>
      <div
        className={`absolute inset-0 rounded-full border-indigo-100 border-t-indigo-600 animate-spin ${isInline ? "border-2" : "border-[3px]"}`}
        aria-hidden="true"
      />
      <BrandLogo className={isInline ? "h-5 w-5" : "h-11 w-11"} ariaLabel="" />
    </div>
  );

  if (isInline) {
    return (
      <div role="status" className="flex items-center justify-center gap-3 py-10 text-sm text-slate-500">
        {spinner}
        <span>{message}</span>
      </div>
    );
  }

  const content = (
    <div className="flex flex-col items-center gap-5 text-center">
      {spinner}
      <div>
        <p className="text-lg font-bold text-slate-900">StudyMatch</p>
        <p className="text-sm text-slate-500">{message}</p>
      </div>
    </div>
  );

  if (variant === "page") {
    return (
      <div role="status" className="flex min-h-[60vh] items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div
      role="status"
      className="flex min-h-screen items-center justify-center bg-slate-50 px-4"
    >
      {content}
    </div>
  );
}
