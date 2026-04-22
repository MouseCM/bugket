require("dotenv").config({ override: true });
const express = require("express");
const cors = require("cors");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 3000;
const MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";
const RAW_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
const API_KEY = RAW_API_KEY.trim().replace(/^['"]|['"]$/g, "");

const gemini = API_KEY
  ? new GoogleGenerativeAI(API_KEY)
  : null;

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

/* ─── Vocabulary Data is now fetched from PostgreSQL via Prisma ─── */

const wordSearchWords = ["ENGLISH", "PUZZLE", "LEARN", "SPEAK", "READ", "WRITE", "SMART"];
const cefrScoreMap = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };

function getCefrScore(level) {
  const normalizedLevel = String(level || "").trim().toUpperCase();
  return cefrScoreMap[normalizedLevel] || 0;
}

/* ─── Conversation Topics ─── */
const conversationTopics = [
  { id: "daily", emoji: "☀️", name: "Cuộc sống hàng ngày", prompt: "Have a casual daily conversation in English. Talk about morning routines, hobbies, food, weather." },
  { id: "travel", emoji: "✈️", name: "Du lịch", prompt: "Practice travel English. Discuss booking hotels, asking for directions, ordering food abroad, airport conversations." },
  { id: "work", emoji: "💼", name: "Công việc", prompt: "Practice workplace English. Discuss job interviews, meetings, presentations, emailing colleagues." },
  { id: "restaurant", emoji: "🍽️", name: "Nhà hàng", prompt: "Practice restaurant English. Order food, ask about menu items, make reservations, pay the bill." },
  { id: "shopping", emoji: "🛍️", name: "Mua sắm", prompt: "Practice shopping English. Ask prices, sizes, compare products, return items." },
  { id: "health", emoji: "🏥", name: "Sức khỏe", prompt: "Practice health-related English. Describe symptoms, visit a doctor, buy medicine at pharmacy." },
  { id: "education", emoji: "📚", name: "Học tập", prompt: "Practice education English. Discuss classes, exams, study tips, academic goals." },
  { id: "free", emoji: "💬", name: "Tự do", prompt: "Have a free conversation in English on any topic the learner wants." }
];

/* ─── Error Detection ─── */
function detectChatError(error) {
  const rawMessage = String(error?.message || "");
  const message = rawMessage.toUpperCase();

  if (message.includes("API_KEY_INVALID") || message.includes("API KEY NOT VALID") || message.includes("API_KEY NOT VALID")) {
    return { status: 401, code: "API_KEY_INVALID", error: "Gemini API key không hợp lệ.", hint: "Kiểm tra lại GEMINI_API_KEY trong file .env." };
  }
  if (message.includes("PERMISSION_DENIED")) {
    return { status: 403, code: "PERMISSION_DENIED", error: "API key không có quyền truy cập model.", hint: "Bật Generative Language API hoặc tạo key mới." };
  }
  if (message.includes("NOT_FOUND") || message.includes("NOT FOUND") || message.includes("MODEL NOT FOUND") || message.includes("MODELS/")) {
    return { status: 404, code: "MODEL_NOT_FOUND", error: "Model Gemini không tồn tại.", hint: "Kiểm tra GEMINI_MODEL hoặc bỏ biến này để dùng model mặc định." };
  }
  if (message.includes("FETCH FAILED") || message.includes("ENOTFOUND") || message.includes("ECONN")) {
    return { status: 503, code: "NETWORK_ERROR", error: "Không kết nối được tới Gemini API.", hint: "Kiểm tra mạng internet." };
  }
  return { status: 500, code: "UNKNOWN_CHAT_ERROR", error: "Lỗi hệ thống khi gọi AI.", hint: "Xem logs server để biết chi tiết." };
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ─── Health Check ─── */
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "Server is running" });
});

/* ─── Words API ─── */
app.get("/api/words", async (req, res) => {
  try {
    const requestedLimit = parseInt(req.query.limit, 10);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(2000, Math.max(1, requestedLimit))
      : 1000;
    const wordsFromDb = await prisma.word.findMany({ take: limit });
    res.json({ words: wordsFromDb });
  } catch (error) {
    console.error("Lỗi khi gọi Database:", error);
    res.status(500).json({ error: "Lỗi kết nối cơ sở dữ liệu." });
  }
});

/* ─── Authentication API ─── */
app.post("/api/auth/register", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");
    const name = String(req.body?.name || "").trim();

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
      data: { 
        email, 
        password: hashedPassword, 
        name,
        streak: 0,
        wordsLearned: 0,
        estimatedLevel: "A1"
      }
    });

    res.json({ message: "Đăng ký thành công!", user: { id: newUser.id, name: newUser.name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi hệ thống khi đăng ký." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || "");
    if (!email || !password) {
      return res.status(400).json({ error: "Vui lòng nhập email và mật khẩu." });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: "Email không tồn tại." });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({ error: "Sai mật khẩu." });
    }

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ 
      token, 
      user: { 
        name: user.name, 
        email: user.email,
        streak: user.streak,
        wordsLearned: user.wordsLearned,
        estimatedLevel: user.estimatedLevel
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi hệ thống khi đăng nhập." });
  }
});

/* ─── GET User Stats API ─── */
app.get("/api/user/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Chưa phân quyền" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { name: true, streak: true, wordsLearned: true, estimatedLevel: true }
    });
    
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch (error) {
    res.status(403).json({ error: "Token không hợp lệ" });
  }
});

app.get("/api/user/rankings", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    let currentUserId = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        currentUserId = decoded?.id || null;
      } catch (_error) {
        currentUserId = null;
      }
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        streak: true,
        wordsLearned: true,
        estimatedLevel: true,
        createdAt: true
      },
      take: 200
    });

    const normalizedUsers = users.map((user) => ({
      ...user,
      levelScore: getCefrScore(user.estimatedLevel)
    }));

    const wordsRanking = [...normalizedUsers]
      .sort((a, b) =>
        b.wordsLearned - a.wordsLearned ||
        b.streak - a.streak ||
        b.levelScore - a.levelScore ||
        a.createdAt - b.createdAt
      )
      .slice(0, 10)
      .map((user, index) => ({
        rank: index + 1,
        name: user.name,
        value: user.wordsLearned,
        estimatedLevel: user.estimatedLevel,
        isCurrentUser: currentUserId != null && user.id === currentUserId
      }));

    const streakRanking = [...normalizedUsers]
      .sort((a, b) =>
        b.streak - a.streak ||
        b.wordsLearned - a.wordsLearned ||
        b.levelScore - a.levelScore ||
        a.createdAt - b.createdAt
      )
      .slice(0, 10)
      .map((user, index) => ({
        rank: index + 1,
        name: user.name,
        value: user.streak,
        estimatedLevel: user.estimatedLevel,
        isCurrentUser: currentUserId != null && user.id === currentUserId
      }));

    const levelRanking = [...normalizedUsers]
      .sort((a, b) =>
        b.levelScore - a.levelScore ||
        b.wordsLearned - a.wordsLearned ||
        b.streak - a.streak ||
        a.createdAt - b.createdAt
      )
      .slice(0, 10)
      .map((user, index) => ({
        rank: index + 1,
        name: user.name,
        value: String(user.estimatedLevel || "A1").toUpperCase(),
        levelScore: user.levelScore,
        isCurrentUser: currentUserId != null && user.id === currentUserId
      }));

    res.json({
      rankings: {
        words: wordsRanking,
        streak: streakRanking,
        level: levelRanking
      }
    });
  } catch (error) {
    console.error("Ranking error:", error);
    res.status(500).json({ error: "Không tải được bảng xếp hạng." });
  }
});

/* ─── Word Search API ─── */
app.get("/api/games/word-search", (_req, res) => {
  res.json({ words: wordSearchWords });
});

/* ─── Conversation Topics API ─── */
app.get("/api/conversation-topics", (_req, res) => {
  res.json({ topics: conversationTopics });
});

/* ─── Chat API (with conversation history) ─── */
app.post("/api/chat", async (req, res) => {
  try {
    const { message, messages, topicId } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        code: "INVALID_MESSAGE",
        error: "Tin nhắn không hợp lệ.",
        hint: "Hãy nhập nội dung trước khi gửi."
      });
    }

    if (!gemini) {
      return res.status(500).json({
        code: "MISSING_API_KEY",
        error: "Chưa cấu hình GEMINI_API_KEY.",
        hint: "Thêm GEMINI_API_KEY vào file .env rồi restart server."
      });
    }

    // Find topic context
    const topic = conversationTopics.find(t => t.id === topicId);
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

    const model = gemini.getGenerativeModel({
      model: MODEL,
      systemInstruction
    });

    // Build conversation history for context
    // Gemini requires: history must start with "user", and alternate user/model
    const history = [];
    if (Array.isArray(messages) && messages.length > 0) {
      const recentMessages = messages.slice(-10);
      for (const msg of recentMessages) {
        const role = msg.role === "user" ? "user" : "model";
        const text = String(msg.text || "").trim();
        if (!text) continue;

        // Ensure alternation: skip if same role as previous
        const lastRole = history.length > 0 ? history[history.length - 1].role : null;
        if (role === lastRole) continue;

        history.push({ role, parts: [{ text }] });
      }

      // Gemini requires history to start with "user" — drop leading model entries
      while (history.length > 0 && history[0].role !== "user") {
        history.shift();
      }

      // Ensure history ends with "model" (not "user") since we're about to send a user message
      while (history.length > 0 && history[history.length - 1].role === "user") {
        history.pop();
      }
    }

    let reply;
    if (history.length >= 2) {
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(message);
      reply = result.response?.text?.() || "Xin lỗi, tôi chưa có câu trả lời.";
    } else {
      // Not enough valid history, send as single message with topic context
      const contextPrefix = topicContext ? `[Context: ${topicContext}]\n\n` : "";
      const result = await model.generateContent(contextPrefix + message);
      reply = result.response?.text?.() || "Xin lỗi, tôi chưa có câu trả lời.";
    }

    return res.json({ reply });
  } catch (error) {
    console.error("Chat error:", error);
    const mapped = detectChatError(error);
    return res.status(mapped.status).json({
      code: mapped.code,
      error: mapped.error,
      hint: mapped.hint,
      details: error?.message || "unknown_error"
    });
  }
});

/* ─── Pronunciation API (enhanced) ─── */
app.post("/api/pronunciation", async (req, res) => {
  try {
    const { target, transcript } = req.body || {};
    const cleanedTarget = String(target || "").trim();
    const cleanedTranscript = String(transcript || "").trim();

    if (!cleanedTarget) {
      return res.status(400).json({
        code: "MISSING_TARGET",
        error: "Thiếu từ/cụm từ mục tiêu.",
        hint: "Hãy nhập từ tiếng Anh muốn luyện."
      });
    }

    if (!cleanedTranscript) {
      return res.status(400).json({
        code: "MISSING_TRANSCRIPT",
        error: "Chưa nhận được câu bạn vừa nói.",
        hint: "Hãy bấm mic và nói từ/cụm từ mục tiêu."
      });
    }

    if (!gemini) {
      return res.status(500).json({
        code: "MISSING_API_KEY",
        error: "Chưa cấu hình GEMINI_API_KEY.",
        hint: "Thêm GEMINI_API_KEY vào .env rồi restart server."
      });
    }

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
      `Từ/cụm mục tiêu: "${cleanedTarget}"`,
      `Transcript hệ thống nhận được: "${cleanedTranscript}"`,
      "",
      "Hãy trả lời CHÍNH XÁC theo format sau (giữ nguyên các header):",
      "",
      "**Kết quả:** Đúng/Gần đúng/Chưa đúng",
      "**Điểm:** X/100",
      "**Phiên âm IPA:** /.../ ",
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

    const result = await model.generateContent(prompt);
    const feedback = result.response?.text?.() || "Mình chưa tạo được góp ý lúc này.";

    // Try to extract score from feedback
    let score = null;
    const scoreMatch = feedback.match(/(\d{1,3})\/100/);
    if (scoreMatch) {
      score = parseInt(scoreMatch[1], 10);
    }

    return res.json({ feedback, score });
  } catch (error) {
    console.error("Pronunciation error:", error);
    const mapped = detectChatError(error);
    return res.status(mapped.status).json({
      code: mapped.code,
      error: mapped.error,
      hint: mapped.hint,
      details: error?.message || "unknown_error"
    });
  }
});

/* ─── Catch-all ─── */
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

module.exports = app;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}
