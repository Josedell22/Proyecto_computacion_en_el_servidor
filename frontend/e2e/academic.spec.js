import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";

async function login(page, email = "carlos@usco.edu.co") {
  await page.goto("/login");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill("Pruebas1234");
  await page.locator('button[type="submit"]').click();
  await expect(page).not.toHaveURL(/login/);
}

async function person(request, name) {
  const email = randomUUID().slice(0, 8) + "@usco.edu.co";
  const response = await request.post("/api/auth/register", { data: { name, email, password: "Pruebas1234" } });
  expect(response.status()).toBe(201);
  const data = await response.json();
  const headers = { Authorization: "Bearer " + data.token };
  await request.put("/api/profile", { headers, data: { name, program: "Ingeniería de Sistemas", semester: 5, bio: "Apoyo académico." } });
  await request.put("/api/profile/subjects", { headers, data: { subjectIds: [1] } });
  return { ...data, email, headers };
}

async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
}

function futureInput() {
  const date = new Date(Date.now() + 4 * 86400000);
  // Application input is local time; all browser projects use America/Bogota.
  return new Date(date.getTime() - 5 * 3600000).toISOString().slice(0, 16);
}

test("complete UI flow: publish, accept, finish, comment-only rating and history", async ({ page, request, browser }) => {
  const student = await person(request, "Estudiante de prueba");
  const advisor = await person(request, "Asesor de prueba");
  await login(page, student.email);
  await page.goto("/solicitudes");
  await page.getByRole("button", { name: "Nueva solicitud" }).click();
  await page.getByLabel("Materia", { exact: true }).selectOption("1");
  await page.getByLabel("Fecha y hora preferida").fill(futureInput());
  await page.getByLabel("Tema que necesitas reforzar").fill("Ejercicios de matrices para la entrega.");
  await page.getByRole("button", { name: "Publicar solicitud", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Solicitud publicada" })).toContainText("Solicitud publicada");
  const advisorContext = await browser.newContext({ locale: "es-CO", timezoneId: "America/Bogota", baseURL: "http://127.0.0.1:5175" });
  const advisorPage = await advisorContext.newPage();
  await login(advisorPage, advisor.email);
  await advisorPage.goto("/solicitudes");
  await advisorPage.getByRole("button", { name: "Abiertas de mis materias" }).click();
  const requestCard = advisorPage.locator("article").filter({ hasText: "Ejercicios de matrices para la entrega." });
  await requestCard.getByRole("button", { name: "Aceptar", exact: true }).click();
  await advisorPage.getByRole("dialog").getByRole("button", { name: "Confirmar y crear sesión" }).click();
  await expect(advisorPage.getByRole("status").filter({ hasText: "Solicitud aceptada" })).toContainText("Solicitud aceptada");
  await advisorPage.goto("/sesiones");
  await advisorPage.getByRole("button", { name: "Marcar como finalizada" }).click();
  await advisorPage.getByRole("dialog").getByRole("button", { name: "Finalizar sesión", exact: true }).click();
  await expect(advisorPage.getByRole("status").filter({ hasText: "Sesión finalizada" })).toContainText("Sesión finalizada");
  await page.goto("/sesiones");
  await page.getByLabel("Comentario (opcional)").fill("Comentario sin tocar las estrellas.");
  await page.getByRole("button", { name: "Enviar valoración" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Gracias por tu valoración" })).toContainText("Gracias por tu valoración");
  await expect(page.getByText("Comentario sin tocar las estrellas.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Enviar valoración" })).toHaveCount(0);
  await page.goto("/historial");
  await page.getByLabel("Participación", { exact: true }).selectOption("student");
  await page.getByLabel("Estado", { exact: true }).selectOption("finished");
  await expect(page.getByRole("status").filter({ hasText: "1 registro encontrado" })).toHaveText("1 registro encontrado");
  await expect(page.getByRole("table")).toContainText("Finalizada");
  await page.getByLabel("Participación", { exact: true }).selectOption("advisor");
  await expect(page.getByRole("heading", { name: "No encontramos resultados" })).toBeVisible();
  await advisorContext.close();
});

test("direct request uses Colombian time even in a different browser timezone", async ({ browser, request }) => {
  const student = await person(request, "Estudiante directo");
  const advisor = await person(request, "Asesor directo");
  const context = await browser.newContext({ timezoneId: "Asia/Tokyo", viewport: { width: 390, height: 844 }, baseURL: "http://127.0.0.1:5175" });
  const page = await context.newPage();
  await login(page, student.email);
  await page.goto("/asesores/" + advisor.user.id);
  await page.getByLabel("Materia", { exact: true }).selectOption("1");
  await page.getByRole("textbox", { name: "Tema que necesitas reforzar" }).fill("Solicitud directa desde el perfil.");
  const input = futureInput();
  await page.getByLabel("Fecha y hora preferida (Colombia)").fill(input);
  await noOverflow(page);
  await page.getByRole("button", { name: "Enviar solicitud", exact: true }).click();
  await expect(page).toHaveURL(/solicitudes$/);
  await expect(page.locator("article")).toContainText("Solicitud directa");
  const response = await request.get("/api/requests", { headers: student.headers });
  const data = await response.json();
  expect(data.requests[0].preferred_at).toBe(new Date(input + "-05:00").toISOString());
  const rejected = await request.patch("/api/requests/" + data.requests[0].id + "/reject", { headers: advisor.headers });
  expect(rejected.status()).toBe(200);
  await page.getByRole("button", { name: "Actualizar", exact: true }).click();
  await expect(page.locator("article")).toContainText("Rechazada");
  await context.close();
});

test("availability supports editing, conflicts, cancelling delete and confirmed deletion", async ({ page, request }) => {
  const advisor = await person(request, "Asesor de horarios");
  await login(page, advisor.email);
  await page.goto("/disponibilidad");
  await page.getByRole("button", { name: "Agregar horario" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Horario agregado." })).toHaveText("Horario agregado.");
  await page.getByRole("button", { name: "Agregar horario" }).click();
  await expect(page.getByRole("alert")).toContainText("se cruza");
  await page.getByRole("button", { name: "Editar", exact: true }).click();
  await page.getByLabel("Día de la semana").selectOption("3");
  await page.getByLabel("Hora de inicio").fill("10:00");
  await page.getByLabel("Hora de fin").fill("12:00");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByRole("heading", { name: "Miércoles", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Eliminar", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Volver" }).click();
  await expect(page.locator("article")).toHaveCount(1);
  await page.getByRole("button", { name: "Eliminar", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Eliminar horario" }).click();
  await expect(page.getByRole("heading", { name: "Tu agenda está por empezar" })).toBeVisible();
});

test("request cancellation has confirmation and an irreversible terminal status", async ({ page, request }) => {
  const student = await person(request, "Estudiante cancelación");
  const result = await request.post("/api/requests", { headers: student.headers, data: { subjectId: 1, description: "Cancelar esta solicitud", preferredAt: new Date(Date.now() + 86400000).toISOString() } });
  expect(result.status()).toBe(201);
  await login(page, student.email);
  await page.goto("/solicitudes");
  await page.getByRole("button", { name: "Cancelar solicitud", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Confirmar", exact: true }).click();
  await expect(page.locator("article")).toContainText("Cancelada");
  await expect(page.getByRole("button", { name: "Cancelar solicitud", exact: true })).toHaveCount(0);
});

test("failed history loads expose retry and successful recovery", async ({ page }) => {
  await login(page);
  let fail = true;
  await page.route("**/api/history?*", async (route) => {
    if (fail) await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "Servicio temporalmente no disponible." }) });
    else await route.continue();
  });
  await page.goto("/historial");
  await expect(page.getByRole("alert")).toContainText("temporalmente");
  await expect(page.getByRole("heading", { name: "No encontramos resultados" })).toHaveCount(0);
  fail = false;
  await page.getByRole("button", { name: "Reintentar" }).click();
  await expect(page.getByRole("table")).toBeVisible();
});

test("late history responses cannot replace the latest filter results", async ({ page }) => {
  await login(page);
  await page.goto("/historial");
  await expect(page.getByRole("table")).toBeVisible();
  await page.route("**/api/history?*", async (route) => {
    const response = await route.fetch();
    if (route.request().url().includes("status=pending")) await new Promise((resolve) => setTimeout(resolve, 700));
    try { await route.fulfill({ response }); } catch { /* Aborted requests are expected. */ }
  });
  await page.getByLabel("Estado", { exact: true }).selectOption("pending");
  await page.getByLabel("Estado", { exact: true }).selectOption("finished");
  await expect(page.getByRole("table")).toContainText("Finalizada");
  await page.waitForTimeout(900);
  await expect(page.getByRole("table")).not.toContainText("Pendiente");
});

test("desktop and mobile visual checks for all modules", async ({ page }, testInfo) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await login(page);
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    for (const [path, title] of [["/solicitudes", "Solicitudes"], ["/sesiones", "Sesiones de asesoría"], ["/historial", "Historial de asesorías"]]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
      await expect(page.getByText("Cargando...", { exact: true })).toHaveCount(0);
      await noOverflow(page);
      if (width === 390 || width === 1440) {
        await page.screenshot({ path: testInfo.outputPath(path.slice(1) + "-" + width + ".png"), fullPage: true });
      }
    }
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Abrir menú" }).click();
  await expect(page.getByRole("navigation")).toBeVisible();
  await page.getByRole("navigation").getByRole("link", { name: "Horarios", exact: true }).click();
  await expect(page.getByRole("navigation")).toBeHidden();
  await noOverflow(page);
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await login(page, "ana@usco.edu.co");
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    await page.goto("/disponibilidad");
    await expect(page.locator("article")).toHaveCount(3);
    await noOverflow(page);
    if (width === 390 || width === 1440) await page.screenshot({ path: testInfo.outputPath("horarios-" + width + ".png"), fullPage: true });
  }
  expect(errors).toEqual([]);
});
