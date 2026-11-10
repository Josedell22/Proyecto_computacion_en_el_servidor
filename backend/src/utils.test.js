const assert = require("node:assert/strict");
const test = require("node:test");
const { isValidEmail, isValidPassword, publicUser } = require("./utils");

test("isValidEmail accepts any valid email format", () => {
  assert.ok(isValidEmail("user@gmail.com"));
  assert.ok(isValidEmail("student@usco.edu.co"));
  assert.ok(isValidEmail("admin@studymatch.edu"));
  assert.ok(isValidEmail("name.lastname@outlook.co"));
  assert.equal(isValidEmail("not-an-email"), false);
  assert.equal(isValidEmail("missing@domain"), false);
  assert.equal(isValidEmail("@example.com"), false);
  assert.equal(isValidEmail(""), false);
});

test("isValidPassword requires at least 8 characters, one letter and one number", () => {
  assert.ok(isValidPassword("Password1"));
  assert.equal(isValidPassword("short1"), false);
  assert.equal(isValidPassword("Password"), false);
  assert.equal(isValidPassword("12345678"), false);
});

test("publicUser exposes safe user fields", () => {
  const row = { id: 1, name: "Ana", email: "ana@example.com", role: "student", password_hash: "secret" };
  const user = publicUser(row);
  assert.equal(user.id, 1);
  assert.equal(user.email, "ana@example.com");
  assert.equal(user.password_hash, undefined);
});
