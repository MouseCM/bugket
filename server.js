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

const http    = require("http");
const socketIo = require("socket.io");

const app  = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

/* ── Middleware ── */
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Inject io into req for use in routes if needed
app.use((req, res, next) => {
  req.io = io;
  next();
});

/* ── Socket.IO Setup ── */
require("./lib/socket")(io);

/* ── API Routes ── */
app.use("/api/auth",                 require("./routes/auth"));
app.use("/api/user",                 require("./routes/user"));
app.use("/api/words",                require("./routes/words"));
app.use("/api/chat",                 require("./routes/chat"));
app.use("/api/games",                require("./routes/games"));
app.use("/api/social",               require("./routes/social"));
app.use("/api/interview",            require("./routes/interview"));

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
module.exports = server;

/* ── Start local server ── */
if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`🚀 Bugket server running at http://localhost:${PORT}`);
  });
}
