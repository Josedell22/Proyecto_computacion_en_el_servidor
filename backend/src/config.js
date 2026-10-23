const DEVELOPMENT_JWT_SECRET = "cambia-esta-clave-en-produccion";

function validateApiConfig(env = process.env) {
  const missing = ["DATABASE_URL", "JWT_SECRET"].filter((key) => !env[key]);
  if (env.NODE_ENV === "production" && !env.CLIENT_ORIGIN) {
    missing.push("CLIENT_ORIGIN");
  }
  if (missing.length) {
    throw new Error(`Faltan variables de entorno requeridas: ${missing.join(", ")}.`);
  }

  if (env.NODE_ENV === "production") {
    if (env.JWT_SECRET === DEVELOPMENT_JWT_SECRET || env.JWT_SECRET.length < 32) {
      throw new Error("En producción, JWT_SECRET debe tener al menos 32 caracteres y no ser la clave de ejemplo.");
    }
    let clientOrigin;
    try {
      clientOrigin = new URL(env.CLIENT_ORIGIN);
    } catch {
      throw new Error("En producción, CLIENT_ORIGIN debe ser un origen HTTP o HTTPS válido.");
    }
    if (
      !["http:", "https:"].includes(clientOrigin.protocol) ||
      clientOrigin.origin !== env.CLIENT_ORIGIN
    ) {
      throw new Error("En producción, CLIENT_ORIGIN debe contener solo el origen, sin rutas ni parámetros.");
    }
    if (["localhost", "127.0.0.1", "[::1]"].includes(clientOrigin.hostname)) {
      throw new Error("En producción, CLIENT_ORIGIN debe apuntar al origen público del frontend.");
    }
  }
}

function validateAdminSeedConfig(env = process.env) {
  if (env.NODE_ENV !== "production") return;

  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    throw new Error("En producción, defina ADMIN_EMAIL y ADMIN_PASSWORD antes de inicializar la base de datos.");
  }
  if (env.ADMIN_PASSWORD.length < 12 || env.ADMIN_PASSWORD === "Admin1234") {
    throw new Error("En producción, ADMIN_PASSWORD debe tener al menos 12 caracteres y no ser la clave de demostración.");
  }
}

module.exports = { validateApiConfig, validateAdminSeedConfig };
