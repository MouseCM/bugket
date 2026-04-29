/* routes/words.js — Vocabulary CRUD */
const express = require("express");
const prisma  = require("../lib/prisma");

const router = express.Router();

/* ── GET /api/words ── */
router.get("/", async (req, res) => {
  try {
    const requestedLimit = parseInt(req.query.limit, 10);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(2000, Math.max(1, requestedLimit))
      : 1000;

    const words = await prisma.word.findMany({ take: limit });
    res.json({ words });
  } catch (err) {
    console.error("[words]", err);
    res.status(500).json({ error: "Lỗi kết nối cơ sở dữ liệu." });
  }
});

module.exports = router;
