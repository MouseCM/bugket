/* routes/chat.js — Gemini Conversational Chat + Pronunciation grading */
const express = require("express");
const { gemini, MODEL, detectChatError } = require("../lib/gemini");

const router = express.Router();

/* ─── Conversation Topics ─── */
const conversationTopics = [
  { id: "daily",      emoji: "☀️", name: "Cuộc sống hàng ngày", prompt: "Have a casual daily conversation in English. Talk about morning routines, hobbies, food, weather." },
  { id: "travel",     emoji: "✈️", name: "Du lịch",             prompt: "Practice travel English. Discuss booking hotels, asking for directions, ordering food abroad, airport conversations." },
  { id: "work",       emoji: "💼", name: "Công việc",            prompt: "Practice workplace English. Discuss job interviews, meetings, presentations, emailing colleagues." },
  { id: "restaurant", emoji: "🍽️", name: "Nhà hàng",            prompt: "Practice restaurant English. Order food, ask about menu items, make reservations, pay the bill." },
  { id: "shopping",   emoji: "🛍️", name: "Mua sắm",             prompt: "Practice shopping English. Ask prices, sizes, compare products, return items." },
  { id: "health",     emoji: "🏥", name: "Sức khỏe",             prompt: "Practice health-related English. Describe symptoms, visit a doctor, buy medicine at pharmacy." },
  { id: "education",  emoji: "📚", name: "Học tập",              prompt: "Practice education English. Discuss classes, exams, study tips, academic goals." },
  { id: "free",       emoji: "💬", name: "Tự do",                prompt: "Have a free conversation in English on any topic the learner wants." }
];

/* ── GET /api/conversation-topics ── */
router.get("/topics", (_req, res) => {
  res.json({ topics: conversationTopics });
});

/* ── POST /api/chat ── */
router.post("/", async (req, res) => {
  try {
    const { message, messages, topicId } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ code: "INVALID_MESSAGE", error: "Tin nhắn không hợp lệ.", hint: "Hãy nhập nội dung trước khi gửi." });
    }
    if (!gemini) {
      return res.status(500).json({ code: "MISSING_API_KEY", error: "Chưa cấu hình GEMINI_API_KEY.", hint: "Thêm GEMINI_API_KEY vào file .env rồi restart server." });
    }

    const topic = conversationTopics.find((t) => t.id === topicId);
    const topicContext = topic ? `Chủ đề hội thoại: ${topic.name}. ${topic.prompt}` : "";

    const systemInstruction = [
      "Bạn là đối tác luyện nói tiếng Anh (speaking partner). Nhiệm vụ của bạn là trò chuyện TỰ NHIÊN với người học như 2 người bạn đang nói chuyện.",
      "",
      "QUY TẮC BẮT BUỘC:",
      "1. LUÔN trả lời theo format: phần tiếng Anh trước, sau đó là phần dịch tiếng Việt.",
      "2. Dùng format: [EN] câu tiếng Anh [/EN] [VI] bản dịch tiếng Việt [/VI]",
      "3. Nói ngắn gọn, tự nhiên (2-4 câu tiếng Anh). KHÔNG viết quá dài.",
      "4. Luôn TIẾP TỤC cuộc hội thoại bằng cách hỏi lại hoặc đưa ra ý mới.",
      "5. Nếu người học nói sai ngữ pháp, nhẹ nhàng sửa lại (gợi ý cách nói đúng).",
      "6. Sau mỗi câu trả lời, gợi ý 2-3 cách người học có thể trả lời tiếp, format: [SUGGEST] cách 1 | cách 2 | cách 3 [/SUGGEST]",
      "7. Điều chỉnh độ khó theo trình độ người học.",
      topicContext ? `8. ${topicContext}` : ""
    ].filter(Boolean).join("\n");

    const model = gemini.getGenerativeModel({ model: MODEL, systemInstruction });

    // Build conversation history, ensuring alternating user/model roles.
    const history = [];
    if (Array.isArray(messages) && messages.length > 0) {
      for (const msg of messages.slice(-10)) {
        const role = msg.role === "user" ? "user" : "model";
        const text = String(msg.text || "").trim();
        if (!text) continue;
        const lastRole = history.length > 0 ? history[history.length - 1].role : null;
        if (role === lastRole) continue;
        history.push({ role, parts: [{ text }] });
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
      const contextPrefix = topicContext ? `[Context: ${topicContext}]\n\n` : "";
      const result = await model.generateContent(contextPrefix + message);
      reply = result.response?.text?.() || "Xin lỗi, tôi chưa có câu trả lời.";
    }

    return res.json({ reply });
  } catch (err) {
    console.error("[chat]", err);
    const mapped = detectChatError(err);
    return res.status(mapped.status).json({ code: mapped.code, error: mapped.error, hint: mapped.hint, details: err?.message });
  }
});

/* ── POST /api/chat/pronunciation ── */
router.post("/pronunciation", async (req, res) => {
  try {
    const target     = String(req.body?.target || "").trim();
    const transcript = String(req.body?.transcript || "").trim();

    if (!target)     return res.status(400).json({ code: "MISSING_TARGET",     error: "Thiếu từ/cụm từ mục tiêu.",          hint: "Hãy nhập từ tiếng Anh muốn luyện." });
    if (!transcript) return res.status(400).json({ code: "MISSING_TRANSCRIPT", error: "Chưa nhận được câu bạn vừa nói.",    hint: "Hãy bấm mic và nói từ/cụm từ mục tiêu." });
    if (!gemini)     return res.status(500).json({ code: "MISSING_API_KEY",    error: "Chưa cấu hình GEMINI_API_KEY.",       hint: "Thêm GEMINI_API_KEY vào .env rồi restart server." });

    const model = gemini.getGenerativeModel({
      model: MODEL,
      systemInstruction: [
        "Bạn là huấn luyện viên phát âm tiếng Anh chuyên nghiệp.",
        "Người học nói vào micro, hệ thống trả về transcript (văn bản).",
        "Bạn đánh giá dựa trên transcript (không có audio).",
        "LUÔN trả lời bằng tiếng Việt để người học dễ hiểu.",
        "Giúp người học cải thiện thực sự, đưa ra lời khuyên cụ thể và hữu ích."
      ].join("\n")
    });

    const prompt = [
      "Nhiệm vụ: đánh giá phát âm của người học.",
      "",
      `Từ/cụm mục tiêu: "${target}"`,
      `Transcript hệ thống nhận được: "${transcript}"`,
      "",
      "Hãy trả lời CHÍNH XÁC theo format sau (giữ nguyên các header):",
      "",
      "**Kết quả:** Đúng/Gần đúng/Chưa đúng",
      "**Điểm:** X/100",
      "**Phiên âm IPA:** /.../",
      "",
      "**Phân tích chi tiết:**",
      "- So sánh từ mục tiêu với transcript",
      "- Âm nào đọc đúng, âm nào cần sửa",
      "",
      "**Hướng dẫn phát âm:**",
      "- Hướng dẫn vị trí lưỡi, môi, hơi thở cho từng âm khó",
      "- Mẹo nhớ cách phát âm",
      "",
      "**Ví dụ câu:** Đưa 1 câu ngắn có chứa từ mục tiêu",
      "",
      "Lưu ý: Nếu transcript khác hoàn toàn, gợi ý nói chậm hơn, tách âm tiết."
    ].join("\n");

    const result   = await model.generateContent(prompt);
    const feedback = result.response?.text?.() || "Mình chưa tạo được góp ý lúc này.";

    const scoreMatch = feedback.match(/(\d{1,3})\/100/);
    const score      = scoreMatch ? parseInt(scoreMatch[1], 10) : null;

    return res.json({ feedback, score });
  } catch (err) {
    console.error("[chat/pronunciation]", err);
    const mapped = detectChatError(err);
    return res.status(mapped.status).json({ code: mapped.code, error: mapped.error, hint: mapped.hint, details: err?.message });
  }
});

module.exports = router;
