/* lib/jwt.js — JWT helpers + auth middleware */
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Express middleware — requires a valid Bearer token.
 * Sets req.user = { id, email, name } on success.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token  = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return res.status(401).json({ error: "Chưa phân quyền." });
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(403).json({ error: "Token không hợp lệ." });
  }
}

/**
 * Like requireAuth but does NOT reject — simply sets req.user if valid.
 * Useful for optional-auth endpoints (e.g. rankings).
 */
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token  = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (token) {
    try { req.user = verifyToken(token); } catch { /* ignore */ }
  }
  next();
}

module.exports = { signToken, verifyToken, requireAuth, optionalAuth, JWT_SECRET };
