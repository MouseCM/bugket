/* routes/games.js — Game data endpoints */
const express = require("express");

const router = express.Router();

const wordSearchWords = ["ENGLISH", "PUZZLE", "LEARN", "SPEAK", "READ", "WRITE", "SMART"];

/* ── GET /api/games/word-search ── */
router.get("/word-search", (_req, res) => {
  res.json({ words: wordSearchWords });
});

module.exports = router;
