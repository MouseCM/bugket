/* routes/user.js — User profile, progress tracking, rankings */
const express = require("express");
const prisma  = require("../lib/prisma");
const { requireAuth, optionalAuth } = require("../lib/jwt");

const router = express.Router();

const cefrScoreMap  = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };
const cefrLevels    = ["A1", "A2", "B1", "B2", "C1", "C2"];

function getCefrScore(level) {
  return cefrScoreMap[String(level || "").trim().toUpperCase()] || 0;
}

/**
 * Calculate the estimated CEFR level based on words learned.
 * Rough heuristic — adjust thresholds as you see fit.
 */
function calcLevel(wordsLearned) {
  if (wordsLearned >= 150) return "C1";
  if (wordsLearned >= 100) return "B2";
  if (wordsLearned >= 60)  return "B1";
  if (wordsLearned >= 30)  return "A2";
  return "A1";
}

/* ── GET /api/user/me ── */
router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, streak: true, wordsLearned: true, estimatedLevel: true }
    });
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json({ user });
  } catch (err) {
    console.error("[user/me]", err);
    res.status(500).json({ error: "Lỗi hệ thống." });
  }
});

/* ── POST /api/user/progress ──
   Called by learn.js each time the user successfully pronounces a new word.
   Body: { wordId } (optional — for deduplication later)
   Updates: wordsLearned +1, streak logic, estimatedLevel.
*/
router.post("/progress", requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { wordsLearned: true, streak: true, lastLearnedAt: true, estimatedLevel: true }
    });
    if (!user) return res.status(404).json({ error: "User not found." });

    const now       = new Date();
    const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastDate  = user.lastLearnedAt
      ? new Date(user.lastLearnedAt.getFullYear(), user.lastLearnedAt.getMonth(), user.lastLearnedAt.getDate())
      : null;

    let newStreak = user.streak;

    if (!lastDate) {
      // First-ever learning session
      newStreak = 1;
    } else {
      const diffDays = Math.round((today - lastDate) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) {
        // Same day — streak unchanged
      } else if (diffDays === 1) {
        // Consecutive day — increment streak
        newStreak = user.streak + 1;
      } else {
        // Missed a day — reset streak
        newStreak = 1;
      }
    }

    const newWordsLearned = user.wordsLearned + 1;
    const newLevel        = calcLevel(newWordsLearned);

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        wordsLearned:   newWordsLearned,
        streak:         newStreak,
        estimatedLevel: newLevel,
        lastLearnedAt:  now
      },
      select: { wordsLearned: true, streak: true, estimatedLevel: true }
    });

    res.json({ user: updated });
  } catch (err) {
    console.error("[user/progress]", err);
    res.status(500).json({ error: "Lỗi cập nhật tiến trình." });
  }
});

/* ── GET /api/user/rankings ── */
router.get("/rankings", optionalAuth, async (req, res) => {
  try {
    const currentUserId = req.user?.id || null;

    const users = await prisma.user.findMany({
      select: { id: true, name: true, streak: true, wordsLearned: true, estimatedLevel: true, createdAt: true },
      take: 200
    });

    const enriched = users.map((u) => ({ ...u, levelScore: getCefrScore(u.estimatedLevel) }));

    const makeRanking = (sorted, valueKey, formatFn) =>
      sorted.slice(0, 10).map((u, i) => ({
        rank: i + 1,
        name: u.name,
        value: formatFn ? formatFn(u[valueKey]) : u[valueKey],
        estimatedLevel: u.estimatedLevel,
        isCurrentUser: currentUserId != null && u.id === currentUserId
      }));

    const byWords  = [...enriched].sort((a, b) => b.wordsLearned - a.wordsLearned  || b.streak - a.streak  || b.levelScore - a.levelScore || a.createdAt - b.createdAt);
    const byStreak = [...enriched].sort((a, b) => b.streak - a.streak              || b.wordsLearned - a.wordsLearned || b.levelScore - a.levelScore || a.createdAt - b.createdAt);
    const byLevel  = [...enriched].sort((a, b) => b.levelScore - a.levelScore      || b.wordsLearned - a.wordsLearned || b.streak - a.streak || a.createdAt - b.createdAt);

    res.json({
      rankings: {
        words:  makeRanking(byWords,  "wordsLearned"),
        streak: makeRanking(byStreak, "streak"),
        level:  makeRanking(byLevel,  "estimatedLevel", (v) => String(v || "A1").toUpperCase())
      }
    });
  } catch (err) {
    console.error("[user/rankings]", err);
    res.status(500).json({ error: "Không tải được bảng xếp hạng." });
  }
});

module.exports = router;
