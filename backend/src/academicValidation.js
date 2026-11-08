const REQUEST_STATUSES = ["pending", "accepted", "rejected", "cancelled", "finished"];
const HISTORY_ROLES = ["student", "advisor"];

function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

function parsePositiveId(value) {
  if (!["string", "number"].includes(typeof value) || !/^[1-9]\d*$/.test(String(value))) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed <= 2147483647 ? parsed : null;
}

function validCalendarDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00Z");
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function parseFutureDate(value, now = new Date()) {
  if (!value) return { error: "La fecha y hora es obligatoria." };
  // Require an explicit zone so server and browser cannot interpret different instants.
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.test(value) ||
      !validCalendarDate(value.slice(0, 10))) {
    return { error: "La fecha y hora no es válida; debe incluir la zona horaria." };
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { error: "La fecha y hora no es válida." };
  if (date < now) return { error: "La fecha y hora debe ser igual o posterior a la fecha actual." };
  return { value: date };
}

function validateAvailabilitySlot({ weekday, startTime, endTime }) {
  const day = Number(weekday);
  if (!["string", "number"].includes(typeof weekday) || !/^[0-6]$/.test(String(weekday))) {
    return { error: "Seleccione un día válido." };
  }
  const timePattern = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
  if (typeof startTime !== "string" || typeof endTime !== "string" ||
      !timePattern.test(startTime) || !timePattern.test(endTime)) {
    return { error: "Las horas de inicio y fin son obligatorias y deben ser válidas." };
  }
  const normalize = (value) => value.length === 5 ? value + ":00" : value;
  if (normalize(endTime) <= normalize(startTime)) {
    return { error: "La hora de fin debe ser posterior a la de inicio." };
  }
  return { value: { weekday: day, startTime, endTime } };
}

function parseDateBoundary(value, endOfDay = false) {
  if (value === "" || value == null) return { value: null };
  if (!validCalendarDate(value)) return { error: "Use una fecha válida con formato AAAA-MM-DD." };
  const suffix = endOfDay ? "T23:59:59.999-05:00" : "T00:00:00.000-05:00";
  return { value: new Date(value + suffix) };
}

module.exports = {
  httpError, HISTORY_ROLES, REQUEST_STATUSES, parseDateBoundary,
  parseFutureDate, parsePositiveId, validateAvailabilitySlot,
};
