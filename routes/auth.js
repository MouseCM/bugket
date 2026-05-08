/* routes/auth.js — Register, Login, Forgot Password, Reset Password */
const express  = require("express");
const bcrypt   = require("bcryptjs");
const crypto   = require("crypto");
const prisma   = require("../lib/prisma");
const { signToken } = require("../lib/jwt");
const { sendMail }  = require("../lib/mailer");

const router = express.Router();

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

/* ── POST /api/auth/register ── */
router.post("/register", async (req, res) => {
  try {
    const email    = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");
    const name     = String(req.body?.name || "").trim();

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Thiếu thông tin đăng ký." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Mật khẩu cần ít nhất 6 ký tự." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Email không hợp lệ." });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Email này đã được đăng ký." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { email, password: hashedPassword, name, streak: 0, wordsLearned: 0, estimatedLevel: "A1" }
    });

    res.json({ message: "Đăng ký thành công!", user: { id: newUser.id, name: newUser.name } });
  } catch (err) {
    console.error("[auth/register]", err);
    res.status(500).json({ error: "Lỗi hệ thống khi đăng ký." });
  }
});

/* ── POST /api/auth/login ── */
router.post("/login", async (req, res) => {
  try {
    const email    = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ error: "Vui lòng nhập email và mật khẩu." });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "Email không tồn tại." });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(400).json({ error: "Sai mật khẩu." });

    const token = signToken({ id: user.id, email: user.email, name: user.name });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        streak: user.streak,
        wordsLearned: user.wordsLearned,
        estimatedLevel: user.estimatedLevel
      }
    });
  } catch (err) {
    console.error("[auth/login]", err);
    res.status(500).json({ error: "Lỗi hệ thống khi đăng nhập." });
  }
});

/* ── POST /api/auth/forgot-password ── */
router.post("/forgot-password", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!email) return res.status(400).json({ error: "Vui lòng nhập email." });

    // Always respond with success to prevent email enumeration.
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.json({ message: "Nếu email tồn tại, chúng tôi đã gửi mã đặt lại mật khẩu." });
    }

    // Generate a 6-digit OTP code, valid for 15 minutes.
    const code    = String(Math.floor(100000 + Math.random() * 900000));
    const expiry  = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: { passwordResetToken: code, passwordResetExpiry: expiry }
    });

    await sendMail({
      to: email,
      subject: "🔑 SpeakUp — Mã đặt lại mật khẩu",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;background:#0f172a;color:#e2e8f0;border-radius:16px;">
          <h2 style="color:#7c3aed;margin-top:0;">SpeakUp 🐛</h2>
          <p>Xin chào <strong>${user.name}</strong>,</p>
          <p>Bạn vừa yêu cầu đặt lại mật khẩu. Dùng mã bên dưới:</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:12px;text-align:center;padding:24px;background:#1e293b;border-radius:12px;color:#a78bfa;margin:24px 0;">
            ${code}
          </div>
          <p style="color:#94a3b8;font-size:13px;">Mã có hiệu lực trong <strong style="color:#e2e8f0;">15 phút</strong>. Nếu bạn không yêu cầu điều này, hãy bỏ qua email này.</p>
          <hr style="border-color:#334155;margin:24px 0;" />
          <p style="font-size:12px;color:#64748b;">SpeakUp — Luyện tiếng Anh cùng AI</p>
        </div>
      `
    });

    res.json({ message: "Nếu email tồn tại, chúng tôi đã gửi mã đặt lại mật khẩu." });
  } catch (err) {
    console.error("[auth/forgot-password]", err);
    res.status(500).json({ error: "Không gửi được email. Vui lòng thử lại sau." });
  }
});

/* ── POST /api/auth/reset-password ── */
router.post("/reset-password", async (req, res) => {
  try {
    const email       = normalizeEmail(req.body?.email);
    const code        = String(req.body?.code || "").trim();
    const newPassword = String(req.body?.newPassword || "");

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: "Thiếu thông tin đặt lại mật khẩu." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Mật khẩu mới cần ít nhất 6 ký tự." });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.passwordResetToken !== code) {
      return res.status(400).json({ error: "Mã xác minh không đúng." });
    }
    if (!user.passwordResetExpiry || new Date() > user.passwordResetExpiry) {
      return res.status(400).json({ error: "Mã xác minh đã hết hạn. Vui lòng yêu cầu mã mới." });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email },
      data: { password: hashed, passwordResetToken: null, passwordResetExpiry: null }
    });

    res.json({ message: "Đặt lại mật khẩu thành công! Hãy đăng nhập lại." });
  } catch (err) {
    console.error("[auth/reset-password]", err);
    res.status(500).json({ error: "Lỗi hệ thống khi đặt lại mật khẩu." });
  }
});

module.exports = router;
