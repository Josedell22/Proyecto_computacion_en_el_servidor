export default function BrandLogo({ className = "h-10 w-10", ariaLabel = "StudyMatch" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={ariaLabel}
      role="img"
    >
      <defs>
        <linearGradient id="studymatch-gradient" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#3730a3" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#studymatch-gradient)" />
      <path
        d="M32 16L46 24L32 32L18 24L32 16Z"
        fill="white"
      />
      <path
        d="M18 24V28C18 31.5 32 36.5 46 28V24"
        fill="white"
        fillOpacity="0.85"
      />
      <circle cx="46" cy="25" r="2.5" fill="white" />
      <path
        d="M46 25C49 30 49 34 48 38"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M24 42L30 48L42 36"
        stroke="#a5b4fc"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
