/* lib/mailer.js — Nodemailer email sender */
const nodemailer = require("nodemailer");

/**
 * Create a Gmail-compatible SMTP transporter.
 * Requires in .env:
 *   EMAIL_USER  — sender address  (e.g. mousecuber@gmail.com)
 *   EMAIL_PASS  — Gmail App Password (not your regular password)
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || ""
  }
});

/**
 * Send an email.
 * @param {object} options - { to, subject, html }
 */
async function sendMail({ to, subject, html }) {
  return transporter.sendMail({
    from: `"SpeakUp" <${process.env.EMAIL_USER || "noreply@SpeakUp.app"}>`,
    to,
    subject,
    html
  });
}

module.exports = { sendMail };
