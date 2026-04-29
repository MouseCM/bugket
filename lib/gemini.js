/* lib/gemini.js — Google Gemini AI client + error helper */
const { GoogleGenerativeAI } = require("@google/generative-ai");

const RAW_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
const API_KEY = RAW_KEY.trim().replace(/^['"]|['"]$/g, "");
const MODEL   = process.env.GEMINI_MODEL || "gemini-1.5-flash";

const gemini = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

/**
 * Map Gemini/network errors to a structured HTTP response payload.
 */
function detectChatError(error) {
  const msg = String(error?.message || "").toUpperCase();

  if (msg.includes("API_KEY_INVALID") || msg.includes("API KEY NOT VALID")) {
    return { status: 401, code: "API_KEY_INVALID", error: "Gemini API key không hợp lệ.", hint: "Kiểm tra lại GEMINI_API_KEY trong file .env." };
  }
  if (msg.includes("PERMISSION_DENIED")) {
    return { status: 403, code: "PERMISSION_DENIED", error: "API key không có quyền truy cập model.", hint: "Bật Generative Language API hoặc tạo key mới." };
  }
  if (msg.includes("NOT_FOUND") || msg.includes("MODEL NOT FOUND") || msg.includes("MODELS/")) {
    return { status: 404, code: "MODEL_NOT_FOUND", error: "Model Gemini không tồn tại.", hint: "Kiểm tra GEMINI_MODEL hoặc bỏ biến này để dùng model mặc định." };
  }
  if (msg.includes("FETCH FAILED") || msg.includes("ENOTFOUND") || msg.includes("ECONN")) {
    return { status: 503, code: "NETWORK_ERROR", error: "Không kết nối được tới Gemini API.", hint: "Kiểm tra mạng internet." };
  }
  return { status: 500, code: "UNKNOWN_CHAT_ERROR", error: "Lỗi hệ thống khi gọi AI.", hint: "Xem logs server để biết chi tiết." };
}

module.exports = { gemini, MODEL, detectChatError };
