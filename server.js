/* ═══════════════════════════════════════════════════════
   server.js — Bugket Express Application Entry Point
   ═══════════════════════════════════════════════════════
   Responsibilities:
     • Load environment variables
     • Configure Express middleware
     • Mount route modules
     • Serve static frontend
     • Start HTTP server (non-Vercel only)
*/

require("dotenv").config({ override: true });

const express = require("express");
const cors    = require("cors");
const path    = require("path");

const app  = express();
const PORT = process.env.PORT || 3000;

/* ── Middleware ── */
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ── API Routes ── */
app.use("/api/auth",                 require("./routes/auth"));
app.use("/api/user",                 require("./routes/user"));
app.use("/api/words",                require("./routes/words"));
app.use("/api/chat",                 require("./routes/chat"));
app.use("/api/games",                require("./routes/games"));

/* ── Legacy alias: /api/pronunciation → /api/chat/pronunciation ──
   Keep existing frontend calls working without changes. */
app.post("/api/pronunciation", (req, res, next) => {
  req.url = "/pronunciation";
  require("./routes/chat")(req, res, next);
});

/* ── Legacy alias: /api/conversation-topics → /api/chat/topics ── */
app.get("/api/conversation-topics", (req, res, next) => {
  req.url = "/topics";
  require("./routes/chat")(req, res, next);
});

/* ── Health Check ── */
app.get("/api/health", (_req, res) => res.json({ ok: true, message: "Server is running" }));

/* ── Catch-all — serve SPA ── */
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ── Export for Vercel ── */
module.exports = app;

/* ── Start local server ── */
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Bugket server running at http://localhost:${PORT}`);
  });
}
