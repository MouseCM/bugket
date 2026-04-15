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

const vocabulary = [
  { english: "adventure", vietnamese: "cuộc phiêu lưu", level: "A2", example: "Learning English is an adventure." },
  { english: "challenge", vietnamese: "thử thách", level: "A2", example: "This game is a fun challenge." },
  { english: "improve", vietnamese: "cải thiện", level: "A2", example: "I improve my speaking every day." },
  { english: "confident", vietnamese: "tự tin", level: "B1", example: "She feels confident in class." },
  { english: "practice", vietnamese: "luyện tập", level: "A1", example: "Practice makes progress." },
  { english: "creative", vietnamese: "sáng tạo", level: "B1", example: "He gave a creative answer." },
  { english: "curious", vietnamese: "tò mò", level: "B1", example: "Curious students ask questions." },
  { english: "habit", vietnamese: "thói quen", level: "A2", example: "Reading is a good habit." },
  { english: "memory", vietnamese: "trí nhớ", level: "A2", example: "Games help your memory." },
  { english: "conversation", vietnamese: "cuộc hội thoại", level: "B1", example: "We had a friendly conversation." }
];

const wordSearchWords = ["ENGLISH", "PUZZLE", "LEARN", "SPEAK", "READ", "WRITE", "SMART"];

function detectChatError(error) {
  const rawMessage = String(error?.message || "");
  const message = rawMessage.toUpperCase();

  if (message.includes("API_KEY_INVALID")) {
    return {
      status: 401,
      code: "API_KEY_INVALID",
      error: "Gemini API key không hợp lệ.",
      hint: "Kiểm tra lại GEMINI_API_KEY trong file .env."
    };
  }
  if (message.includes("API KEY NOT VALID") || message.includes("API_KEY NOT VALID")) {
    return {
      status: 401,
      code: "API_KEY_INVALID",
      error: "Gemini API key không hợp lệ.",
      hint: "Hãy dùng key tạo từ Google AI Studio (không dùng nhầm key dịch vụ khác)."
    };
  }

  if (message.includes("PERMISSION_DENIED")) {
    return {
      status: 403,
      code: "PERMISSION_DENIED",
      error: "API key không có quyền truy cập model.",
      hint: "Bật Generative Language API hoặc tạo key mới trong Google AI Studio."
    };
  }

  if (
    message.includes("NOT_FOUND") ||
    message.includes("NOT FOUND") ||
    message.includes("MODEL NOT FOUND") ||
    message.includes("MODELS/")
  ) {
    return {
      status: 404,
      code: "MODEL_NOT_FOUND",
      error: "Model Gemini không tồn tại hoặc không dùng được.",
      hint: "Kiểm tra GEMINI_MODEL trên Vercel Environment Variables, hoặc bỏ biến này để dùng model mặc định."
    };
  }

  if (message.includes("FETCH FAILED") || message.includes("ENOTFOUND") || message.includes("ECONN")) {
    return {
      status: 503,
      code: "NETWORK_ERROR",
      error: "Không kết nối được tới Gemini API.",
      hint: "Kiểm tra mạng internet, VPN, hoặc firewall."
    };
  }

  return {
    status: 500,
    code: "UNKNOWN_CHAT_ERROR",
    error: "Lỗi hệ thống khi gọi AI API.",
    hint: "Xem logs server để biết chi tiết."
  };
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "Server is running" });
});

app.get("/api/words", (_req, res) => {
  res.json({ words: vocabulary });
});

app.get("/api/games/word-search", (_req, res) => {
  res.json({ words: wordSearchWords });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body || {};
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
        error: "Chưa cấu hình GEMINI_API_KEY trong file .env.",
        hint: "Thêm GEMINI_API_KEY vào file .env rồi restart server."
      });
    }

    const model = gemini.getGenerativeModel({
      model: MODEL,
      systemInstruction:
        "Bạn là gia sư tiếng Anh thân thiện. Luôn trả lời bằng tiếng Việt để giải thích, kèm ví dụ tiếng Anh ngắn gọn để người học dễ hiểu."
    });

    const result = await model.generateContent(message);
    const reply = result.response?.text?.() || "Xin lỗi, tôi chưa có câu trả lời phù hợp.";
    return res.json({ reply });
  } catch (error) {
    console.error(error);
    const mapped = detectChatError(error);
    return res.status(mapped.status).json({
      code: mapped.code,
      error: mapped.error,
      hint: mapped.hint,
      details: error?.message || "unknown_error"
    });
  }
});

app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

module.exports = app;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}
