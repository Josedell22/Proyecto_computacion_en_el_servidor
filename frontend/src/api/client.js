const TOKEN_KEY = "studymatch_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  let res;
  try {
    res = await fetch(path, { ...options, headers });
  } catch {
    throw new Error("No se pudo conectar con el servidor. Verifique que el backend esté en ejecución.");
  }
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await res.json().catch(() => ({}))
    : {};
  if (!res.ok) {
    const error = new Error(
      data.message || `No se pudo completar la operación (HTTP ${res.status}${res.statusText ? " " + res.statusText : ""}).`
    );
    error.status = res.status;
    error.data = data;
    throw error;
  }
  return data;
}

export function formatDate(value) {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Bogota",
  });
}

export function formatTime(value) {
  return String(value).slice(0, 5);
}

export function toApiDateTime(value) {
  return value ? new Date(value + "-05:00").toISOString() : null;
}

export function toLocalDateTimeInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - 5 * 60 * 60_000).toISOString().slice(0, 16);
}

export function currentLocalDateTimeInput() {
  const now = new Date();
  now.setSeconds(0, 0);
  now.setMinutes(now.getMinutes() + 1);
  return toLocalDateTimeInput(now);
}

export const STATUS_LABEL = {
  pending: "Pendiente",
  accepted: "Aceptada",
  rejected: "Rechazada",
  cancelled: "Cancelada",
  finished: "Finalizada",
  confirmed: "Confirmada",
};
