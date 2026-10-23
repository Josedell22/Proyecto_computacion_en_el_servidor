require("dotenv").config();
const { validateApiConfig } = require("./config");
const path = require("path");
const express = require("express");
const cors = require("cors");
const { requireAuth, requireAdmin, loadUser } = require("./middleware/auth");

validateApiConfig();

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/api/health", (_req, res) => res.json({ ok: true, name: "StudyMatch" }));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/subjects", requireAuth, require("./routes/subjects"));
app.use("/api/profile", requireAuth, loadUser, require("./routes/profile"));
app.use("/api/tutors", requireAuth, loadUser, require("./routes/tutors"));
app.use("/api/availability", requireAuth, loadUser, require("./routes/availability"));
app.use("/api/requests", requireAuth, loadUser, require("./routes/requests"));
app.use("/api/sessions", requireAuth, loadUser, require("./routes/sessions"));
app.use("/api/history", requireAuth, loadUser, require("./routes/history"));
app.use("/api/publications", requireAuth, loadUser, require("./routes/publications"));
app.use("/api/admin", requireAuth, requireAdmin, require("./routes/admin"));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "No se pudo completar la operación. Intente de nuevo." });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`StudyMatch API en http://localhost:${port}`);
});
