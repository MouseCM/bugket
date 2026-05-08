const express = require("express");
const { gemini, MODEL, detectChatError } = require("../lib/gemini");
const { requireAuth } = require("../lib/jwt");

const router = express.Router();

const interviewRoles = [
  { id: "swe", emoji: "💻", name: "Software Engineer", prompt: "Conduct a technical interview for a Software Engineer position. Ask about algorithms, system design, and previous experience." },
  { id: "auditor", emoji: "📊", name: "IT Auditor", prompt: "Conduct an interview for an IT Auditor position. Ask about compliance, risk assessment, security frameworks (like ISO 27001), and audit procedures." },
  { id: "pm", emoji: "🚀", name: "Product Manager", prompt: "Conduct an interview for a Product Manager position. Ask about product strategy, prioritizing features, dealing with stakeholders, and metrics." },
  { id: "hr", emoji: "🤝", name: "HR Manager", prompt: "Conduct a behavioral interview. Ask about strengths, weaknesses, conflict resolution, and cultural fit." }
];

/* ── GET /api/interview/roles ── */
router.get("/roles", (req, res) => {
  res.json({ roles: interviewRoles });
});

/* ── POST /api/interview ── */
router.post("/", async (req, res) => {
  try {
    const { message, messages, roleId } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ code: "INVALID_MESSAGE", error: "Tin nhắn không hợp lệ.", hint: "Hãy nhập nội dung trước khi gửi." });
    }
    if (!gemini) {
      return res.status(500).json({ code: "MISSING_API_KEY", error: "Chưa cấu hình GEMINI_API_KEY.", hint: "Thêm GEMINI_API_KEY vào file .env rồi restart server." });
    }

    const role = interviewRoles.find((r) => r.id === roleId);
    const roleContext = role ? role.prompt : "Conduct a general job interview.";

    const systemInstruction = [
      "Bạn là một nhà tuyển dụng (Interviewer). Nhiệm vụ của bạn là phỏng vấn ứng viên.",
      "",
      "QUY TẮC BẮT BUỘC:",
      "1. LUÔN trả lời theo format: phần tiếng Anh trước, sau đó là phần dịch tiếng Việt.",
      "2. Dùng format: [EN] câu tiếng Anh [/EN] [VI] bản dịch tiếng Việt [/VI]",
      "3. Hỏi từng câu một, chờ ứng viên trả lời rồi mới nhận xét ngắn gọn và hỏi câu tiếp theo. KHÔNG hỏi nhiều câu cùng lúc.",
      "4. Nhẹ nhàng sửa lỗi tiếng Anh của ứng viên nếu cần.",
      "5. Giữ thái độ chuyên nghiệp của một nhà tuyển dụng.",
      `6. CHUYÊN MÔN: ${roleContext}`
    ].join("\n");

    const model = gemini.getGenerativeModel({ model: MODEL, systemInstruction });

    const history = [];
    if (Array.isArray(messages) && messages.length > 0) {
      for (const msg of messages.slice(-10)) {
        const msgRole = msg.role === "user" ? "user" : "model";
        const text = String(msg.text || "").trim();
        if (!text) continue;
        const lastRole = history.length > 0 ? history[history.length - 1].role : null;
        if (msgRole === lastRole) continue;
        history.push({ role: msgRole, parts: [{ text }] });
      }
      while (history.length > 0 && history[0].role !== "user") history.shift();
      while (history.length > 0 && history[history.length - 1].role === "user") history.pop();
    }

    let reply;
    if (history.length >= 2) {
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(message);
      reply = result.response?.text?.() || "Xin lỗi, tôi chưa có câu trả lời.";
    } else {
      const result = await model.generateContent(message);
      reply = result.response?.text?.() || "Xin lỗi, tôi chưa có câu trả lời.";
    }

    return res.json({ reply });
  } catch (err) {
    console.error("[interview]", err);
    const mapped = detectChatError(err);
    return res.status(mapped.status).json({ code: mapped.code, error: mapped.error, hint: mapped.hint, details: err?.message });
  }
});

/* ── POST /api/interview/grade ── */
router.post("/grade", async (req, res) => {
  try {
    const { messages, roleId } = req.body || {};
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Không có lịch sử cuộc hội thoại để đánh giá." });
    }

    if (!gemini) {
      return res.status(500).json({ error: "Chưa cấu hình GEMINI_API_KEY." });
    }

    const role = interviewRoles.find((r) => r.id === roleId);
    const roleName = role ? role.name : "Phỏng vấn chung";

    const transcriptText = messages.map(m => `${m.role === 'user' ? 'Ứng viên' : 'Nhà tuyển dụng'}: ${m.text}`).join("\n");

    const model = gemini.getGenerativeModel({
      model: MODEL,
      systemInstruction: "Bạn là một chuyên gia nhân sự và ngôn ngữ. Nhiệm vụ của bạn là đánh giá buổi phỏng vấn của ứng viên dựa trên lịch sử trò chuyện. Trả lời bằng tiếng Việt."
    });

    const prompt = [
      `Vị trí phỏng vấn: ${roleName}`,
      "Dưới đây là lịch sử buổi phỏng vấn:",
      "```",
      transcriptText,
      "```",
      "",
      "Hãy đánh giá buổi phỏng vấn này và đưa ra nhận xét chi tiết. Trả lời CHÍNH XÁC theo format sau:",
      "",
      "**Điểm số:** X/100",
      "**Nhận xét chung:** (1-2 câu nhận xét tổng quan về buổi phỏng vấn)",
      "",
      "**Điểm mạnh:**",
      "- ...",
      "- ...",
      "",
      "**Điểm cần cải thiện:**",
      "- (về ngôn ngữ, từ vựng, ngữ pháp)",
      "- (về kỹ năng trả lời phỏng vấn, kiến thức chuyên môn)",
      "",
      "**Gợi ý luyện tập:**",
      "- (đưa ra lời khuyên cụ thể để ứng viên cải thiện)"
    ].join("\n");

    const result = await model.generateContent(prompt);
    const feedback = result.response?.text?.() || "Không thể tạo đánh giá lúc này.";

    const scoreMatch = feedback.match(/(\d{1,3})\/100/);
    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : null;

    return res.json({ feedback, score });
  } catch (err) {
    console.error("[interview/grade]", err);
    const mapped = detectChatError(err);
    return res.status(mapped.status).json({ code: mapped.code, error: mapped.error, hint: mapped.hint, details: err?.message });
  }
});

module.exports = router;
