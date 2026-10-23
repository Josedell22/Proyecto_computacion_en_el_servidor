function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    program: row.program,
    semester: row.semester,
    bio: row.bio,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

function profileStatus(user, subjectCount) {
  const missing = [];
  if (!user.program) missing.push("programa académico");
  if (!user.semester) missing.push("semestre");
  if (!user.bio) missing.push("descripción personal");
  const canRequest = Boolean(user.program && user.semester);
  const canOffer = canRequest && subjectCount > 0;
  return {
    complete: missing.length === 0,
    canRequest,
    canOffer,
    missing,
    message: missing.length
      ? `Falta completar: ${missing.join(", ")}.`
      : "El perfil tiene la información mínima para usar StudyMatch.",
  };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPassword(password) {
  return typeof password === "string" && password.length >= 8 && /[A-Za-z]/.test(password) && /\d/.test(password);
}

const REPORT_REASONS = [
  "Contenido inapropiado",
  "Información incorrecta",
  "Incumple las reglas",
  "Spam o publicidad",
  "Otro",
];

module.exports = {
  publicUser,
  profileStatus,
  isValidEmail,
  isValidPassword,
  REPORT_REASONS,
};
