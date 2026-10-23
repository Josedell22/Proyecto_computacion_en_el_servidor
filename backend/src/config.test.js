const assert = require("node:assert/strict");
const test = require("node:test");
const { validateApiConfig, validateAdminSeedConfig } = require("./config");

test("allows configured local development", () => {
  assert.doesNotThrow(() =>
    validateApiConfig({
      DATABASE_URL: "postgres://localhost/studymatch",
      JWT_SECRET: "development-secret",
      NODE_ENV: "development",
    })
  );
});

test("requires database and signing configuration", () => {
  assert.throws(
    () => validateApiConfig({}),
    /DATABASE_URL, JWT_SECRET/
  );
});

test("rejects development signing secrets and local origins in production", () => {
  const base = {
    DATABASE_URL: "postgres://localhost/studymatch",
    CLIENT_ORIGIN: "https://studymatch.example",
    NODE_ENV: "production",
  };
  assert.throws(
    () => validateApiConfig({ ...base, JWT_SECRET: "cambia-esta-clave-en-produccion" }),
    /JWT_SECRET/
  );
  assert.throws(
    () =>
      validateApiConfig({
        ...base,
        JWT_SECRET: "a".repeat(32),
        CLIENT_ORIGIN: "http://localhost:5173",
      }),
    /CLIENT_ORIGIN/
  );
  assert.throws(
    () =>
      validateApiConfig({
        ...base,
        JWT_SECRET: "a".repeat(32),
        CLIENT_ORIGIN: "https://studymatch.example/app",
      }),
    /solo el origen/
  );
  assert.doesNotThrow(() => validateApiConfig({ ...base, JWT_SECRET: "a".repeat(32) }));
});

test("requires custom administrator credentials for production seeding", () => {
  assert.throws(() => validateAdminSeedConfig({ NODE_ENV: "production" }), /ADMIN_EMAIL/);
  assert.throws(
    () =>
      validateAdminSeedConfig({
        NODE_ENV: "production",
        ADMIN_EMAIL: "admin@example.com",
        ADMIN_PASSWORD: "Admin1234",
      }),
    /ADMIN_PASSWORD/
  );
  assert.doesNotThrow(() =>
    validateAdminSeedConfig({
      NODE_ENV: "production",
      ADMIN_EMAIL: "admin@example.com",
      ADMIN_PASSWORD: "a-unique-password-2026",
    })
  );
  assert.doesNotThrow(() => validateAdminSeedConfig({ NODE_ENV: "development" }));
});
