/* ═══════════════════════════════════════════
   bugket — Learn/Vocabulary JS
   ═══════════════════════════════════════════ */

const flashWord = document.getElementById("flash-word");
const flashIPA = document.getElementById("flash-ipa");
const flashMeaning = document.getElementById("flash-meaning");
const flashExample = document.getElementById("flash-example");
const flashListen = document.getElementById("flash-listen");
const flashMic = document.getElementById("flash-mic");
const flashWaves = document.getElementById("flash-waves");
const flashMicStatus = document.getElementById("flash-mic-status");
const flashTranscript = document.getElementById("flash-transcript");
const flashFeedback = document.getElementById("flash-feedback");
const flashFeedbackPanel = document.getElementById("flash-feedback-panel");
const flashScoreCard = document.getElementById("flash-score-card");
const flashScoreNumber = document.getElementById("flash-score-number");
const flashScoreBar = document.getElementById("flash-score-bar");
const flashRetry = document.getElementById("flash-retry");
const nextWordBtn = document.getElementById("next-word");
const wordList = document.getElementById("word-list");
const learnTotalWords = document.getElementById("learn-total-words");
const learnStatus = document.getElementById("learn-status");

let words = [];
let index = 0;

// Words learned this session (by english text) — avoid double-counting
const learnedThisSession = new Set();

/* ─── Progress API ─── */
async function recordWordLearned() {
  const token = localStorage.getItem("token");
  if (!token) return; // Not logged in — skip silently

  try {
    const res = await fetch("/api/user/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      // Update cached user in localStorage so dashboard reflects latest stats
      const cachedRaw = localStorage.getItem("user");
      if (cachedRaw && data.user) {
        try {
          const cached = JSON.parse(cachedRaw);
          localStorage.setItem("user", JSON.stringify({ ...cached, ...data.user }));
        } catch { /* ignore */ }
      }
      showProgressToast(data.user);
    }
  } catch { /* non-critical — ignore */ }
}

function showProgressToast(user) {
  const existing = document.getElementById("progress-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "progress-toast";
  toast.style.cssText = [
    "position:fixed;bottom:24px;right:24px;z-index:9999",
    "background:linear-gradient(135deg,#7c3aed,#2563eb)",
    "color:#fff;padding:14px 20px;border-radius:14px",
    "box-shadow:0 8px 32px rgba(0,0,0,.4);font-size:14px",
    "display:flex;flex-direction:column;gap:4px",
    "animation:slideInRight .3s ease"
  ].join(";");

  const streak = user?.streak ?? "—";
  const words  = user?.wordsLearned ?? "—";
  const level  = user?.estimatedLevel ?? "—";

  toast.innerHTML = `
    <strong style="font-size:15px">✅ Từ đã được ghi nhận!</strong>
    <span>🔥 Streak: ${streak} ngày &nbsp;|&nbsp; 📚 Từ đã học: ${words} &nbsp;|&nbsp; 🎯 Level: ${level}</span>
  `;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = "0"; toast.style.transition = "opacity .5s"; setTimeout(() => toast.remove(), 500); }, 3500);
}

/* ─── Utilities ─── */
function getSpeechRecognition() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function chooseFemaleVoice(voices) {
  const list = voices || [];
  const en = list.filter((v) => (v.lang || "").toLowerCase().startsWith("en"));

  const byNamePriority = [
    /samantha/i,
    /victoria/i,
    /zira/i,
    /google uk english female/i,
    /female/i,
    /woman/i,
    /girl/i
  ];

  for (const re of byNamePriority) {
    const v = en.find((voice) => re.test(voice.name || ""));
    if (v) return v;
  }

  // Try matching female-like names in all voices (some browsers mis-label lang).
  for (const re of byNamePriority) {
    const v = list.find((voice) => re.test(voice.name || ""));
    if (v) return v;
  }

  // Deterministic fallback to first English voice.
  return en[0] || list[0] || null;
}

function ensureVoicesLoaded() {
  if (!window.speechSynthesis) return Promise.resolve([]);
  const synth = window.speechSynthesis;
  const existing = synth.getVoices();
  if (existing && existing.length) return Promise.resolve(existing);

  if (window.__bugketVoicesPromise) return window.__bugketVoicesPromise;

  window.__bugketVoicesPromise = new Promise((resolve) => {
    let done = false;
    const resolveOnce = (voices) => {
      if (done) return;
      done = true;
      resolve(voices || []);
    };

    const timeout = setTimeout(() => resolveOnce(synth.getVoices() || []), 2500);

    const handler = () => {
      clearTimeout(timeout);
      resolveOnce(synth.getVoices() || []);
    };

    if (typeof synth.addEventListener === "function") {
      synth.addEventListener("voiceschanged", handler, { once: true });
    } else {
      synth.onvoiceschanged = handler;
    }
  });

  return window.__bugketVoicesPromise;
}

let speakSeq = 0;
function speak(text, lang = "en-US") {
  if (!window.speechSynthesis) return;
  const synth = window.speechSynthesis;
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.85; // Tốc độ hơi chậm lại để dễ nghe phát âm
  utterance.pitch = 1.0; // Cao độ bình thường

  const seq = ++speakSeq;

  ensureVoicesLoaded().then((voices) => {
    if (seq !== speakSeq) return;

    const cached = window.__bugketFemaleVoice;
    const isCachedUsable = cached && voices.some((v) => v === cached);
    const femaleVoice = isCachedUsable ? cached : chooseFemaleVoice(voices);

    if (femaleVoice) {
      window.__bugketFemaleVoice = femaleVoice;
      utterance.voice = femaleVoice;
    }

    synth.speak(utterance);
  });
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatFeedback(text) {
  const safe = escapeHtml(text);
  return safe
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^\* (.+)$/gm, "• $1")
    .replace(/\n/g, "<br>");
}

/* ─── Render Flashcard ─── */
function renderFlashcard() {
  if (!words.length) return;
  const item = words[index];

  if (flashWord) flashWord.textContent = item.english;
  if (flashIPA) flashIPA.textContent = item.ipa || "";
  if (flashMeaning) flashMeaning.textContent = `${item.vietnamese || "—"} — Cấp độ: ${item.level || "A1"}`;
  if (flashExample) {
    flashExample.textContent = item.example ? `💬 "${item.example}"` : "💬 Chưa có ví dụ cho từ này.";
  }

  // Reset pronunciation state
  if (flashTranscript) flashTranscript.textContent = "—";
  if (flashFeedbackPanel) flashFeedbackPanel.style.display = "none";
  if (flashScoreCard) flashScoreCard.style.display = "none";
  if (flashScoreBar) flashScoreBar.style.width = "0%";
  if (flashMicStatus) flashMicStatus.textContent = "Bấm mic và đọc từ ở trên";
}

/* ─── Render Word List ─── */
function renderList() {
  if (!wordList) return;
  wordList.innerHTML = "";

  if (!words.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "Chưa có dữ liệu từ vựng để hiển thị.";
    wordList.appendChild(empty);
    return;
  }

  words.forEach((item) => {
    const card = document.createElement("div");
    card.className = "word-item";
    card.style.cursor = "pointer";

    const english = document.createElement("strong");
    english.textContent = item.english || "—";
    card.appendChild(english);

    if (item.ipa) {
      const ipa = document.createElement("div");
      ipa.className = "small word-ipa";
      ipa.textContent = item.ipa;
      card.appendChild(ipa);
    }

    const vn = document.createElement("p");
    vn.className = "small muted word-vn";
    vn.textContent = item.vietnamese || "—";
    card.appendChild(vn);

    const example = document.createElement("p");
    example.className = "small word-example";
    example.textContent = item.example || "Không có ví dụ";
    card.appendChild(example);

    card.addEventListener("click", () => speak(item.english || ""));
    wordList.appendChild(card);
  });
}

/* ─── Listen to Sample ─── */
function listenSample() {
  if (!words.length) return;
  const word = words[index]?.english;
  if (word) speak(word);
}

/* ─── Pronunciation Practice ─── */
async function getPronunciationFeedback({ target, transcript }) {
  const res = await fetch("/api/pronunciation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target, transcript })
  });
  const data = await res.json();
  if (!res.ok) {
    const errorText = [data.error, data.hint].filter(Boolean).join("\n");
    throw new Error(errorText || "Lỗi khi gọi API.");
  }
  return { feedback: data.feedback || "Không có phản hồi.", score: data.score };
}

function animateScore(target, numberEl, barEl) {
  if (!numberEl || !barEl) return;

  numberEl.className = "score-value";
  if (target >= 70) numberEl.classList.add("good");
  else if (target >= 40) numberEl.classList.add("ok");
  else numberEl.classList.add("bad");

  let current = 0;
  const step = Math.ceil(target / 30);
  const interval = setInterval(() => {
    current = Math.min(current + step, target);
    numberEl.textContent = current;
    if (current >= target) clearInterval(interval);
  }, 25);

  setTimeout(() => { barEl.style.width = target + "%"; }, 100);
}

async function startFlashPronounce() {
  if (!flashMic || !words.length) return;

  const target = words[index]?.english || "";
  if (!target) return;

  const SpeechRecognition = getSpeechRecognition();
  if (!SpeechRecognition) {
    if (flashMicStatus) flashMicStatus.textContent = "Trình duyệt chưa hỗ trợ. Dùng Chrome/Edge.";
    return;
  }

  if (flashMicStatus) flashMicStatus.textContent = "Đang nghe... hãy đọc rõ ràng";
  flashMic.classList.add("recording");
  if (flashWaves) flashWaves.classList.add("active");

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = async (event) => {
    const text = event.results?.[0]?.[0]?.transcript?.trim?.() || "";
    if (flashTranscript) flashTranscript.textContent = text || "—";
    if (flashMicStatus) flashMicStatus.textContent = "Đang phân tích...";

    try {
      const { feedback, score } = await getPronunciationFeedback({ target, transcript: text });

      if (flashFeedback) flashFeedback.innerHTML = formatFeedback(feedback);
      if (flashFeedbackPanel) flashFeedbackPanel.style.display = "block";

      if (score !== null && score !== undefined && flashScoreCard) {
        flashScoreCard.style.display = "block";
        animateScore(score, flashScoreNumber, flashScoreBar);
      }

      if (flashMicStatus) flashMicStatus.textContent = "Xem góp ý bên dưới ↓";

      // Record progress if score is acceptable (≥50) and word not yet counted
      if (score != null && score >= 50 && !learnedThisSession.has(target)) {
        learnedThisSession.add(target);
        await recordWordLearned();
      }
    } catch (error) {
      if (flashMicStatus) flashMicStatus.textContent = String(error?.message || "Lỗi.");
    }
  };


  recognition.onerror = (event) => {
    if (flashMicStatus) flashMicStatus.textContent = `Không nghe được (${event?.error || "unknown"}).`;
  };

  recognition.onend = () => {
    flashMic.classList.remove("recording");
    if (flashWaves) flashWaves.classList.remove("active");
  };

  try {
    recognition.start();
  } catch (_e) {
    flashMic.classList.remove("recording");
    if (flashWaves) flashWaves.classList.remove("active");
    if (flashMicStatus) flashMicStatus.textContent = "Không thể bật micro.";
  }
}

/* ─── Retry ─── */
function retryFlash() {
  if (flashScoreCard) flashScoreCard.style.display = "none";
  if (flashFeedbackPanel) flashFeedbackPanel.style.display = "none";
  if (flashTranscript) flashTranscript.textContent = "—";
  if (flashScoreBar) flashScoreBar.style.width = "0%";
  if (flashMicStatus) flashMicStatus.textContent = "Bấm mic để thử lại";
}

/* ─── Event Listeners ─── */
nextWordBtn?.addEventListener("click", () => {
  index = (index + 1) % words.length;
  renderFlashcard();
});

flashListen?.addEventListener("click", listenSample);
flashMic?.addEventListener("click", startFlashPronounce);
flashRetry?.addEventListener("click", retryFlash);

/* ─── Init ─── */
async function init() {
  try {
    if (wordList) {
      wordList.innerHTML = '<p class="muted">Đang tải danh sách từ vựng...</p>';
    }

    const res = await fetch("/api/words");
    const data = await res.json();
    words = data.words || [];

    if (learnTotalWords) learnTotalWords.textContent = String(words.length);
    if (learnStatus) learnStatus.textContent = words.length >= 10 ? "Sẵn sàng luyện tập" : "Tiếp tục bổ sung từ";

    renderFlashcard();
    renderList();
  } catch (_e) {
    if (flashWord) flashWord.textContent = "Lỗi tải dữ liệu";
    if (wordList) {
      wordList.innerHTML = '<p class="muted">Không tải được danh sách từ vựng. Vui lòng thử lại.</p>';
    }
  }
}

init();
