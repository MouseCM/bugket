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

/* ─── Vocabulary Data ─── */
const vocabulary = [
  // Level A1 (Sơ cấp)
  { english: "hello", vietnamese: "xin chào", level: "A1", ipa: "/həˈləʊ/", example: "Hello, how are you?" },
  { english: "friend", vietnamese: "người bạn", level: "A1", ipa: "/frend/", example: "She is my best friend." },
  { english: "happy", vietnamese: "hạnh phúc, vui vẻ", level: "A1", ipa: "/ˈhæpi/", example: "I feel very happy today." },
  { english: "water", vietnamese: "nước", level: "A1", ipa: "/ˈwɔːtər/", example: "I need to drink some water." },
  { english: "family", vietnamese: "gia đình", level: "A1", ipa: "/ˈfæməli/", example: "My family loves to travel." },
  { english: "learn", vietnamese: "học", level: "A1", ipa: "/lɜːn/", example: "I want to learn English." },
  { english: "beautiful", vietnamese: "xinh đẹp", level: "A1", ipa: "/ˈbjuːtɪfl/", example: "The flower is very beautiful." },
  { english: "morning", vietnamese: "buổi sáng", level: "A1", ipa: "/ˈmɔːnɪŋ/", example: "Good morning, everyone!" },
  { english: "time", vietnamese: "thời gian", level: "A1", ipa: "/taɪm/", example: "What time is it?" },
  { english: "eat", vietnamese: "ăn", level: "A1", ipa: "/iːt/", example: "I like to eat apples." },

  // Level A2 (Sơ trung cấp)
  { english: "adventure", vietnamese: "cuộc phiêu lưu", level: "A2", ipa: "/ədˈventʃər/", example: "Learning English is an adventure." },
  { english: "challenge", vietnamese: "thử thách", level: "A2", ipa: "/ˈtʃælɪndʒ/", example: "This game is a fun challenge." },
  { english: "improve", vietnamese: "cải thiện", level: "A2", ipa: "/ɪmˈpruːv/", example: "I want to improve my speaking." },
  { english: "habit", vietnamese: "thói quen", level: "A2", ipa: "/ˈhæbɪt/", example: "Reading everyday is a good habit." },
  { english: "memory", vietnamese: "trí nhớ", level: "A2", ipa: "/ˈmeməri/", example: "Games help your memory." },
  { english: "vocabulary", vietnamese: "từ vựng", level: "A2", ipa: "/vəˈkæbjʊləri/", example: "Building vocabulary is important." },
  { english: "describe", vietnamese: "mô tả", level: "A2", ipa: "/dɪˈskraɪb/", example: "Can you describe your hometown?" },
  { english: "decide", vietnamese: "quyết định", level: "A2", ipa: "/dɪˈsaɪd/", example: "I decide to study abroad." },
  { english: "borrow", vietnamese: "mượn", level: "A2", ipa: "/ˈbɒrəʊ/", example: "Can I borrow your book?" },
  { english: "careful", vietnamese: "cẩn thận", level: "A2", ipa: "/ˈkeəfl/", example: "Please be careful!" },

  // Level B1 (Trung cấp)
  { english: "confident", vietnamese: "tự tin", level: "B1", ipa: "/ˈkɒnfɪdənt/", example: "She feels confident in class." },
  { english: "creative", vietnamese: "sáng tạo", level: "B1", ipa: "/kriˈeɪtɪv/", example: "He gave a creative answer." },
  { english: "curious", vietnamese: "tò mò", level: "B1", ipa: "/ˈkjʊəriəs/", example: "Curious students ask questions." },
  { english: "conversation", vietnamese: "cuộc hội thoại", level: "B1", ipa: "/ˌkɒnvəˈseɪʃən/", example: "We had a friendly conversation." },
  { english: "pronunciation", vietnamese: "phát âm", level: "B1", ipa: "/prəˌnʌnsiˈeɪʃən/", example: "Good pronunciation takes practice." },
  { english: "fluent", vietnamese: "lưu loát", level: "B1", ipa: "/ˈfluːənt/", example: "She is fluent in three languages." },
  { english: "communicate", vietnamese: "giao tiếp", level: "B1", ipa: "/kəˈmjuːnɪkeɪt/", example: "We communicate through words." },
  { english: "opportunity", vietnamese: "cơ hội", level: "B1", ipa: "/ˌɒpəˈtjuːnɪti/", example: "This is a great opportunity to learn." },
  { english: "experience", vietnamese: "kinh nghiệm, trải nghiệm", level: "B1", ipa: "/ɪkˈspɪəriəns/", example: "Traveling is a wonderful experience." },
  { english: "knowledge", vietnamese: "kiến thức", level: "B1", ipa: "/ˈnɒlɪdʒ/", example: "Reading books expands your knowledge." },

  // Level B2 (Trung cao cấp)
  { english: "essential", vietnamese: "thiết yếu", level: "B2", ipa: "/ɪˈsenʃəl/", example: "Water is essential for life." },
  { english: "accomplish", vietnamese: "hoàn thành", level: "B2", ipa: "/əˈkʌmplɪʃ/", example: "She accomplished all her goals." },
  { english: "enthusiasm", vietnamese: "sự nhiệt tình", level: "B2", ipa: "/ɪnˈθjuːziæzəm/", example: "His enthusiasm is contagious." },
  { english: "persevere", vietnamese: "kiên trì", level: "B2", ipa: "/ˌpɜːsɪˈvɪər/", example: "You must persevere to succeed." },
  { english: "significant", vietnamese: "đáng kể, quan trọng", level: "B2", ipa: "/sɪɡˈnɪfɪkənt/", example: "There is a significant difference." },
  { english: "fascinating", vietnamese: "hấp dẫn, lôi cuốn", level: "B2", ipa: "/ˈfæsɪneɪtɪŋ/", example: "The history of this city is fascinating." },
  { english: "ambitious", vietnamese: "tham vọng", level: "B2", ipa: "/æmˈbɪʃəs/", example: "He is an ambitious young man." },
  { english: "versatile", vietnamese: "linh hoạt, đa năng", level: "B2", ipa: "/ˈvɜːsətaɪl/", example: "A smartphone is a versatile device." },
  { english: "perspective", vietnamese: "góc nhìn, quan điểm", level: "B2", ipa: "/pəˈspektɪv/", example: "We need to look at this from a different perspective." },
  { english: "resilient", vietnamese: "kiên cường", level: "B2", ipa: "/rɪˈzɪliənt/", example: "She is very resilient and never gives up." },

  // Level C1 (Cao cấp)
  { english: "eloquent", vietnamese: "hùng hồn, lưu loát", level: "C1", ipa: "/ˈeləkwənt/", example: "She made an eloquent speech." },
  { english: "meticulous", vietnamese: "tỉ mỉ, quá kỹ càng", level: "C1", ipa: "/məˈtɪkjələs/", example: "He is meticulous about his work." },
  { english: "ubiquitous", vietnamese: "xuất hiện ở khắp nơi", level: "C1", ipa: "/juːˈbɪkwɪtəs/", example: "Smartphones have become ubiquitous." },
  { english: "ephemeral", vietnamese: "chóng vánh, phù du", level: "C1", ipa: "/ɪˈfemərəl/", example: "Fame can be ephemeral." },
  { english: "serendipity", vietnamese: "sự tình cờ may mắn", level: "C1", ipa: "/ˌserənˈdɪpəti/", example: "We found this cafe by pure serendipity." },
  { english: "paradigm", vietnamese: "mô hình, hệ chuẩn", level: "C1", ipa: "/ˈpærədaɪm/", example: "We need a paradigm shift in education." },
  { english: "pragmatic", vietnamese: "thực tế, thực dụng", level: "C1", ipa: "/præɡˈmætɪk/", example: "We need a pragmatic approach to the problem." },
  { english: "conundrum", vietnamese: "câu đố, vấn đề nan giải", level: "C1", ipa: "/kəˈnʌndrəm/", example: "This is a difficult conundrum to solve." },
  { english: "intricate", vietnamese: "phức tạp, tinh xảo", level: "C1", ipa: "/ˈɪntrɪkət/", example: "The watch has an intricate mechanism." },
  { english: "resplendent", vietnamese: "rực rỡ, chói lọi", level: "C1", ipa: "/rɪˈsplendənt/", example: "She looked resplendent in her dress." },

  // Additional words (to make vocabulary total = 100)
  // Level A1 (Sơ cấp)
  { english: "cat", vietnamese: "con mèo", level: "A1", ipa: "/kæt/", example: "The cat is sleeping." },
  { english: "dog", vietnamese: "con chó", level: "A1", ipa: "/dɔːɡ/", example: "My dog is friendly." },
  { english: "book", vietnamese: "quyển sách", level: "A1", ipa: "/bʊk/", example: "I read a book every week." },
  { english: "teacher", vietnamese: "giáo viên", level: "A1", ipa: "/ˈtiːtʃər/", example: "My teacher explains clearly." },
  { english: "student", vietnamese: "học sinh", level: "A1", ipa: "/ˈstudənt/", example: "The student is studying now." },
  { english: "city", vietnamese: "thành phố", level: "A1", ipa: "/ˈsɪti/", example: "This city is exciting." },
  { english: "country", vietnamese: "đất nước", level: "A1", ipa: "/ˈkʌntri/", example: "We visit a country each summer." },
  { english: "today", vietnamese: "hôm nay", level: "A1", ipa: "/təˈdeɪ/", example: "Today is a good day to learn." },
  { english: "tomorrow", vietnamese: "ngày mai", level: "A1", ipa: "/təˈmɒrəʊ/", example: "Let's start tomorrow." },
  { english: "night", vietnamese: "buổi tối", level: "A1", ipa: "/naɪt/", example: "I like quiet nights." },

  // Level A2 (Sơ trung cấp)
  { english: "important", vietnamese: "quan trọng", level: "A2", ipa: "/ɪmˈpɔːrtənt/", example: "It's important to practice daily." },
  { english: "problem", vietnamese: "vấn đề", level: "A2", ipa: "/ˈprɒbləm/", example: "Do you have a problem?" },
  { english: "answer", vietnamese: "câu trả lời", level: "A2", ipa: "/ˈɑːnsər/", example: "The correct answer is A." },
  { english: "question", vietnamese: "câu hỏi", level: "A2", ipa: "/ˈkwestʃən/", example: "I have a question for you." },
  { english: "useful", vietnamese: "hữu ích", level: "A2", ipa: "/ˈjuːsfəl/", example: "This advice is useful." },
  { english: "because", vietnamese: "bởi vì", level: "A2", ipa: "/bɪˈkɒz/", example: "I stayed home because it rained." },
  { english: "afternoon", vietnamese: "buổi chiều", level: "A2", ipa: "/ˌæftəˈnuːn/", example: "See you in the afternoon." },
  { english: "restaurant", vietnamese: "nhà hàng", level: "A2", ipa: "/ˈrestrɒnt/", example: "We found a nice restaurant." },
  { english: "price", vietnamese: "giá cả", level: "A2", ipa: "/praɪs/", example: "What's the price of this?" },
  { english: "shopping", vietnamese: "mua sắm", level: "A2", ipa: "/ˈʃɒpɪŋ/", example: "Shopping online is fast." },
  { english: "free", vietnamese: "miễn phí", level: "A2", ipa: "/friː/", example: "The concert is free." },
  { english: "helpful", vietnamese: "hữu ích", level: "A2", ipa: "/ˈhelpfl/", example: "Your feedback is very helpful." },

  // Level B1 (Trung cấp)
  { english: "however", vietnamese: "tuy nhiên", level: "B1", ipa: "/haʊˈevər/", example: "However, it takes time." },
  { english: "although", vietnamese: "mặc dù", level: "B1", ipa: "/ɔːlˈðoʊ/", example: "Although it's hard, I will continue." },
  { english: "manage", vietnamese: "quản lý", level: "B1", ipa: "/ˈmænɪdʒ/", example: "I manage my time well." },
  { english: "provide", vietnamese: "cung cấp", level: "B1", ipa: "/prəˈvaɪd/", example: "This app provides practice." },
  { english: "discover", vietnamese: "khám phá", level: "B1", ipa: "/dɪˈskʌvə(r)/", example: "I discovered a new word." },
  { english: "choose", vietnamese: "chọn", level: "B1", ipa: "/tʃuːz/", example: "Choose the correct option." },
  { english: "explain", vietnamese: "giải thích", level: "B1", ipa: "/ɪkˈspleɪn/", example: "Can you explain that again?" },
  { english: "solve", vietnamese: "giải quyết", level: "B1", ipa: "/sɒlv/", example: "We can solve this problem." },
  { english: "practice", vietnamese: "luyện tập", level: "B1", ipa: "/ˈpræktɪs/", example: "Practice improves your confidence." },
  { english: "suggest", vietnamese: "gợi ý", level: "B1", ipa: "/səˈdʒest/", example: "I suggest listening first." },
  { english: "support", vietnamese: "hỗ trợ", level: "B1", ipa: "/səˈpɔːrt/", example: "My friends support me." },
  { english: "effort", vietnamese: "nỗ lực", level: "B1", ipa: "/ˈefət/", example: "Small effort leads to big results." },
  { english: "compare", vietnamese: "so sánh", level: "B1", ipa: "/kəmˈpɛər/", example: "Let's compare the answers." },
  { english: "mistake", vietnamese: "sai lầm", level: "B1", ipa: "/mɪˈsteɪk/", example: "Everyone makes mistakes." },

  // Level B2 (Trung cao cấp)
  { english: "benefit", vietnamese: "lợi ích", level: "B2", ipa: "/ˈbenɪfɪt/", example: "Studying daily has benefits." },
  { english: "develop", vietnamese: "phát triển", level: "B2", ipa: "/dɪˈveləp/", example: "I want to develop my speaking." },
  { english: "maintain", vietnamese: "duy trì", level: "B2", ipa: "/meɪnˈteɪn/", example: "Maintain a consistent study routine." },
  { english: "schedule", vietnamese: "lịch trình", level: "B2", ipa: "/ˈskedʒuːl/", example: "Check your study schedule." },
  { english: "convenient", vietnamese: "thuận tiện", level: "B2", ipa: "/kənˈviːniənt/", example: "It's convenient for me." },
  { english: "require", vietnamese: "yêu cầu", level: "B2", ipa: "/rɪˈkwaɪər/", example: "This task requires focus." },
  { english: "environment", vietnamese: "môi trường", level: "B2", ipa: "/ɪnˈvaɪrənmənt/", example: "We must protect the environment." },
  { english: "responsibility", vietnamese: "trách nhiệm", level: "B2", ipa: "/rɪˌspɒnsəˈbɪləti/", example: "Responsibility makes you stronger." },
  { english: "progress", vietnamese: "tiến bộ", level: "B2", ipa: "/ˈprəʊɡres/", example: "Your progress is impressive." },
  { english: "necessary", vietnamese: "cần thiết", level: "B2", ipa: "/ˈnesəsəri/", example: "It's necessary to review." },

  // Level C1 (Cao cấp)
  { english: "comprehensive", vietnamese: "toàn diện", level: "C1", ipa: "/ˌkɒmprɪˈhensɪv/", example: "A comprehensive plan saves time." },
  { english: "profound", vietnamese: "sâu sắc", level: "C1", ipa: "/prəˈfaʊnd/", example: "Her advice was profound." },
  { english: "nuanced", vietnamese: "tinh tế", level: "C1", ipa: "/nuːˈɑːnst/", example: "The discussion was nuanced." },
  { english: "substantial", vietnamese: "đáng kể", level: "C1", ipa: "/səbˈstænʃəl/", example: "There is a substantial improvement." }
];

const wordSearchWords = ["ENGLISH", "PUZZLE", "LEARN", "SPEAK", "READ", "WRITE", "SMART"];

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
app.get("/api/words", (_req, res) => {
  res.json({ words: vocabulary });
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
