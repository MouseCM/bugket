/* ═══════════════════════════════════════════
   bugket — Chat & Pronunciation JS
   ═══════════════════════════════════════════ */

/* ─── DOM Elements: Conversation ─── */
const chatBox = document.getElementById("chat-box");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const voiceMicBtn = document.getElementById("voice-mic-btn");
const voiceWaves = document.getElementById("voice-waves");
const micStatus = document.getElementById("mic-status");
const suggestionsBox = document.getElementById("suggestions");
const topicGrid = document.getElementById("topic-grid");

/* ─── DOM Elements: Pronunciation ─── */
const pronounceTarget = document.getElementById("pronounce-target");
const pronounceMic = document.getElementById("pronounce-mic");
const pronounceWaves = document.getElementById("pronounce-waves");
const pronounceStatus = document.getElementById("pronounce-status");
const pronounceTranscript = document.getElementById("pronounce-transcript");
const pronounceFeedback = document.getElementById("pronounce-feedback");
const feedbackPanel = document.getElementById("feedback-panel");
const scoreCard = document.getElementById("score-card");
const scoreNumber = document.getElementById("score-number");
const scoreBar = document.getElementById("score-bar");
const listenSampleBtn = document.getElementById("listen-sample-btn");
const listenAgainBtn = document.getElementById("listen-again-btn");
const retryBtn = document.getElementById("retry-btn");
const ipaDisplay = document.getElementById("ipa-display");

/* ─── DOM Elements: Settings ─── */
const voiceSelect = document.getElementById("voice-select");
const speedSlider = document.getElementById("speed-slider");
const speedLabel = document.getElementById("speed-label");

/* ─── Tab Panels ─── */
const tabConversation = document.getElementById("tab-conversation");
const tabPronunciation = document.getElementById("tab-pronunciation");
const panelConversation = document.getElementById("panel-conversation");
const panelPronunciation = document.getElementById("panel-pronunciation");

/* ─── State ─── */
let conversationHistory = [];
let currentTopicId = "free";
let isSpeaking = false;
let wordsForLookup = null;

/* ─── Utilities ─── */
function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatBotMessage(text) {
  const safe = escapeHtml(text);
  return safe
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^\* (.+)$/gm, "• $1")
    .replace(/\n/g, "<br>");
}

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

let availableVoices = [];

function populateVoiceList() {
  if (!window.speechSynthesis || !voiceSelect) return;
  ensureVoicesLoaded().then(voices => {
    availableVoices = voices.filter(v => (v.lang || "").toLowerCase().startsWith("en"));
    if (availableVoices.length === 0) availableVoices = voices;
    
    voiceSelect.innerHTML = "";
    availableVoices.forEach((voice, i) => {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = `${voice.name} (${voice.lang})`;
      
      const defaultFemale = chooseFemaleVoice(availableVoices);
      if (defaultFemale && voice === defaultFemale) {
        option.selected = true;
      }
      
      voiceSelect.appendChild(option);
    });
  });
}

let speakSeq = 0;
function speak(text, lang = "en-US") {
  if (!window.speechSynthesis) return;
  const synth = window.speechSynthesis;
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  
  if (speedSlider) {
    utterance.rate = parseFloat(speedSlider.value) || 0.95;
  } else {
    utterance.rate = 0.95;
  }
  
  utterance.pitch = 1.0; 

  const seq = ++speakSeq;

  ensureVoicesLoaded().then((voices) => {
    if (seq !== speakSeq) return;

    let selectedVoice = null;
    if (voiceSelect && voiceSelect.value) {
      selectedVoice = availableVoices[parseInt(voiceSelect.value, 10)];
    }
    
    if (!selectedVoice) {
       selectedVoice = chooseFemaleVoice(voices);
    }

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    synth.speak(utterance);
  });
}

/* ─── Tab Switching ─── */
window.switchTab = function(tab) {
  if (!panelConversation || !panelPronunciation || !tabConversation || !tabPronunciation) return;

  if (tab === "conversation") {
    panelConversation.style.display = "";
    panelPronunciation.style.display = "none";
    tabConversation.className = "btn btn-primary";
    tabPronunciation.className = "btn btn-secondary";
  } else {
    panelConversation.style.display = "none";
    panelPronunciation.style.display = "";
    tabConversation.className = "btn btn-secondary";
    tabPronunciation.className = "btn btn-primary";
  }
};

// Auto-switch if URL has #pronunciation
if (window.location.hash === "#pronunciation") {
  switchTab("pronunciation");
}

/* ═══════════════════════════════════════════
   CONVERSATION TAB
   ═══════════════════════════════════════════ */

/* ─── Parse AI Response ─── */
function parseAIResponse(text) {
  let english = "";
  let vietnamese = "";
  let suggestions = [];

  // Extract [EN]...[/EN]
  const enMatch = text.match(/\[EN\]([\s\S]*?)\[\/EN\]/i);
  if (enMatch) {
    english = enMatch[1].trim();
  }

  // Extract [VI]...[/VI]
  const viMatch = text.match(/\[VI\]([\s\S]*?)\[\/VI\]/i);
  if (viMatch) {
    vietnamese = viMatch[1].trim();
  }

  // Extract [SUGGEST]...[/SUGGEST]
  const suggestMatch = text.match(/\[SUGGEST\]([\s\S]*?)\[\/SUGGEST\]/i);
  if (suggestMatch) {
    suggestions = suggestMatch[1].split("|").map(s => s.trim()).filter(Boolean);
  }

  // Fallback: if no tags found, treat entire text as content
  if (!english && !vietnamese) {
    english = text
      .replace(/\[EN\]|\[\/EN\]|\[VI\]|\[\/VI\]|\[SUGGEST\][\s\S]*?\[\/SUGGEST\]/gi, "")
      .trim();
  }

  return { english, vietnamese, suggestions };
}

/* ─── Add Chat Message ─── */
function addMessage(text, who, options = {}) {
  const div = document.createElement("div");
  div.className = `bubble ${who}`;

  if (who === "bot") {
    const parsed = parseAIResponse(text);
    const label = document.createElement("span");
    label.className = "bubble-label";
    label.textContent = "AI";
    div.appendChild(label);

    // English part
    const enDiv = document.createElement("div");
    enDiv.innerHTML = formatBotMessage(parsed.english || text);
    div.appendChild(enDiv);

    // Vietnamese translation
    if (parsed.vietnamese) {
      const viDiv = document.createElement("div");
      viDiv.className = "bubble-vi";
      viDiv.innerHTML = "🇻🇳 " + formatBotMessage(parsed.vietnamese);
      div.appendChild(viDiv);
    }

    // Play button for AI voice
    if (parsed.english) {
      const playBtn = document.createElement("button");
      playBtn.className = "play-btn";
      playBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><polygon points="5,3 19,12 5,21" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg> Nghe AI đọc';
      playBtn.addEventListener("click", () => speak(parsed.english));
      div.appendChild(playBtn);
    }

    // Show suggestions
    if (parsed.suggestions.length > 0) {
      showSuggestions(parsed.suggestions);
    }

    // Auto-speak if enabled
    if (parsed.english && !options.silent) {
      speak(parsed.english);
    }

    // Store raw text for history
    conversationHistory.push({ role: "bot", text });
  } else {
    const label = document.createElement("span");
    label.className = "bubble-label";
    label.textContent = "Bạn";
    div.appendChild(label);

    const contentDiv = document.createElement("div");
    contentDiv.textContent = text;
    div.appendChild(contentDiv);

    conversationHistory.push({ role: "user", text });
  }

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

/* ─── Typing Indicator ─── */
function showTyping() {
  const div = document.createElement("div");
  div.className = "bubble bot";
  div.id = "typing-bubble";
  div.innerHTML = '<span class="bubble-label">AI</span><div class="typing-indicator"><span></span><span></span><span></span></div>';
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function removeTyping() {
  const el = document.getElementById("typing-bubble");
  if (el) el.remove();
}

/* ─── Show Suggestions ─── */
function showSuggestions(items) {
  if (!suggestionsBox) return;
  suggestionsBox.innerHTML = "";
  items.forEach(text => {
    const btn = document.createElement("button");
    btn.className = "suggestion-btn";
    btn.textContent = text;
    btn.addEventListener("click", () => {
      chatInput.value = text;
      sendMessage();
    });
    suggestionsBox.appendChild(btn);
  });
}

function clearSuggestions() {
  if (suggestionsBox) suggestionsBox.innerHTML = "";
}

/* ─── Send Message ─── */
async function sendMessage() {
  const message = chatInput.value.trim();
  if (!message) return;
  addMessage(message, "user");
  chatInput.value = "";
  clearSuggestions();

  showTyping();

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        messages: conversationHistory.slice(0, -1), // exclude the message we just added
        topicId: currentTopicId
      })
    });

    const data = await res.json();
    removeTyping();

    if (!res.ok) {
      const errorText = [data.error, data.hint].filter(Boolean).join("\n");
      addMessage(errorText || "Lỗi khi gọi API.", "bot", { silent: true });
      return;
    }

    addMessage(data.reply || "Không có phản hồi.", "bot");
  } catch (_error) {
    removeTyping();
    addMessage("Không thể kết nối đến máy chủ.", "bot", { silent: true });
  }
}

/* ─── Voice Input for Conversation ─── */
function startVoiceInput() {
  const SpeechRecognition = getSpeechRecognition();
  if (!SpeechRecognition) {
    if (micStatus) micStatus.textContent = "Trình duyệt chưa hỗ trợ. Dùng Chrome/Edge.";
    return;
  }

  if (isSpeaking) return;
  isSpeaking = true;

  if (micStatus) micStatus.textContent = "Đang nghe... hãy nói tiếng Anh";
  if (voiceMicBtn) voiceMicBtn.classList.add("recording");
  if (voiceWaves) voiceWaves.classList.add("active");

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const text = event.results?.[0]?.[0]?.transcript?.trim?.() || "";
    if (text) {
      chatInput.value = text;
      sendMessage();
    } else {
      if (micStatus) micStatus.textContent = "Không nghe rõ, hãy thử lại";
    }
  };

  recognition.onerror = (event) => {
    if (micStatus) micStatus.textContent = `Lỗi: ${event?.error || "unknown"}. Hãy thử lại.`;
  };

  recognition.onend = () => {
    isSpeaking = false;
    if (voiceMicBtn) voiceMicBtn.classList.remove("recording");
    if (voiceWaves) voiceWaves.classList.remove("active");
    if (micStatus) micStatus.textContent = "Bấm mic để nói tiếp";
  };

  try {
    recognition.start();
  } catch (_e) {
    isSpeaking = false;
    if (voiceMicBtn) voiceMicBtn.classList.remove("recording");
    if (voiceWaves) voiceWaves.classList.remove("active");
    if (micStatus) micStatus.textContent = "Không thể bật micro. Kiểm tra quyền truy cập.";
  }
}

/* ─── Load Topics ─── */
async function loadTopics() {
  if (!topicGrid) return;
  try {
    const res = await fetch("/api/conversation-topics");
    const data = await res.json();
    const topics = data.topics || [];

    topicGrid.innerHTML = "";
    topics.forEach(topic => {
      const btn = document.createElement("button");
      btn.className = "topic-chip" + (topic.id === currentTopicId ? " active" : "");
      btn.innerHTML = `<span class="emoji">${topic.emoji}</span> ${topic.name}`;
      btn.addEventListener("click", () => {
        currentTopicId = topic.id;
        // Update active state
        topicGrid.querySelectorAll(".topic-chip").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        // Reset conversation
        conversationHistory = [];
        chatBox.innerHTML = "";
        clearSuggestions();
        
        showTyping();
        
        fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `Hello! I want to talk about "${topic.name}". Please greet me and ask me a specific question about this topic to start our conversation.`,
            isInit: true,
            messages: [],
            topicId: currentTopicId
          })
        })
        .then(res => res.json())
        .then(data => {
          removeTyping();
          if (data.error) {
             addMessage("Lỗi: " + data.error, "bot", { silent: true });
             return;
          }
          if (data.reply) {
             addMessage(data.reply, "bot");
          }
        })
        .catch(_e => {
          removeTyping();
          addMessage(`[EN] Let's talk about "${topic.name}". What is on your mind? [/EN] [VI] Hãy nói về "${topic.name}". Bạn đang nghĩ gì? [/VI] [SUGGEST] Let's start [/SUGGEST]`, "bot", { silent: true });
        });
      });
      topicGrid.appendChild(btn);
    });
  } catch (_e) {
    // Silently fail
  }
}

/* ═══════════════════════════════════════════
   PRONUNCIATION TAB
   ═══════════════════════════════════════════ */

/* ─── Play Sample Audio ─── */
function playSample() {
  const target = pronounceTarget?.value?.trim();
  if (!target) {
    if (pronounceStatus) pronounceStatus.textContent = "Nhập từ trước rồi bấm nghe mẫu.";
    return;
  }
  speak(target, "en-US");
  if (pronounceStatus) pronounceStatus.textContent = `Đang phát: "${target}"`;
}

/* ─── Pronunciation Check ─── */
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

async function startPronounce() {
  if (!pronounceTarget || !pronounceMic) return;

  const target = pronounceTarget.value.trim();
  if (!target) {
    if (pronounceStatus) pronounceStatus.textContent = "Nhập từ/cụm từ mục tiêu trước.";
    return;
  }

  const SpeechRecognition = getSpeechRecognition();
  if (!SpeechRecognition) {
    if (pronounceStatus) pronounceStatus.textContent = "Trình duyệt chưa hỗ trợ. Dùng Chrome/Edge.";
    return;
  }

  if (pronounceStatus) pronounceStatus.textContent = "Đang nghe... hãy đọc rõ ràng";
  pronounceMic.classList.add("recording");
  if (pronounceWaves) pronounceWaves.classList.add("active");

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = async (event) => {
    const text = event.results?.[0]?.[0]?.transcript?.trim?.() || "";
    if (pronounceTranscript) pronounceTranscript.textContent = text || "—";
    if (pronounceStatus) pronounceStatus.textContent = "Đang phân tích phát âm...";

    try {
      const { feedback, score } = await getPronunciationFeedback({ target, transcript: text });

      // Show feedback
      if (pronounceFeedback) pronounceFeedback.innerHTML = formatBotMessage(feedback);
      if (feedbackPanel) feedbackPanel.style.display = "";

      // Show score
      if (score !== null && score !== undefined && scoreCard) {
        scoreCard.style.display = "";
        animateScore(score);
      }

      if (pronounceStatus) pronounceStatus.textContent = "Xem góp ý bên dưới. Bấm 'Nói lại' để thử lại.";
    } catch (error) {
      if (pronounceStatus) pronounceStatus.textContent = String(error?.message || "Lỗi.");
    }
  };

  recognition.onerror = (event) => {
    if (pronounceStatus) pronounceStatus.textContent = `Không nghe được (${event?.error || "unknown"}).`;
  };

  recognition.onend = () => {
    pronounceMic.classList.remove("recording");
    if (pronounceWaves) pronounceWaves.classList.remove("active");
  };

  try {
    recognition.start();
  } catch (_e) {
    pronounceMic.classList.remove("recording");
    if (pronounceWaves) pronounceWaves.classList.remove("active");
    if (pronounceStatus) pronounceStatus.textContent = "Không thể bật micro.";
  }
}

/* ─── Animate Score ─── */
function animateScore(target) {
  if (!scoreNumber || !scoreBar) return;

  // Set color class
  scoreNumber.className = "score-value";
  if (target >= 70) scoreNumber.classList.add("good");
  else if (target >= 40) scoreNumber.classList.add("ok");
  else scoreNumber.classList.add("bad");

  // Animate number
  let current = 0;
  const step = Math.ceil(target / 30);
  const interval = setInterval(() => {
    current = Math.min(current + step, target);
    scoreNumber.textContent = current;
    if (current >= target) clearInterval(interval);
  }, 25);

  // Animate bar
  setTimeout(() => {
    scoreBar.style.width = target + "%";
  }, 100);
}

/* ─── Update IPA when target changes ─── */
async function loadWordsForLookup() {
  if (Array.isArray(wordsForLookup)) return wordsForLookup;
  try {
    const res = await fetch("/api/words");
    const data = await res.json();
    wordsForLookup = Array.isArray(data.words) ? data.words : [];
  } catch (_error) {
    wordsForLookup = [];
  }
  return wordsForLookup;
}

async function updateIPA() {
  if (!ipaDisplay || !pronounceTarget) return;
  const target = pronounceTarget.value.trim().toLowerCase();
  if (!target) {
    ipaDisplay.textContent = "—";
    return;
  }

  const words = await loadWordsForLookup();
  const match = words.find((word) => String(word.english || "").toLowerCase() === target);
  ipaDisplay.textContent = match && match.ipa ? match.ipa : "—";
}

/* ─── Retry Pronunciation ─── */
function retryPronunciation() {
  if (scoreCard) scoreCard.style.display = "none";
  if (feedbackPanel) feedbackPanel.style.display = "none";
  if (pronounceTranscript) pronounceTranscript.textContent = "—";
  if (scoreBar) scoreBar.style.width = "0%";
  if (pronounceStatus) pronounceStatus.textContent = "Bấm mic để thử lại";
}

/* ═══════════════════════════════════════════
   EVENT LISTENERS
   ═══════════════════════════════════════════ */

// Conversation
sendBtn?.addEventListener("click", sendMessage);
chatInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});
voiceMicBtn?.addEventListener("click", startVoiceInput);

// Pronunciation
pronounceMic?.addEventListener("click", startPronounce);
listenSampleBtn?.addEventListener("click", playSample);
listenAgainBtn?.addEventListener("click", playSample);
retryBtn?.addEventListener("click", retryPronunciation);

// IPA lookup on input change (debounced)
let ipaTimeout;
pronounceTarget?.addEventListener("input", () => {
  clearTimeout(ipaTimeout);
  ipaTimeout = setTimeout(updateIPA, 400);
});

// Settings
if (speedSlider) {
  speedSlider.addEventListener("input", (e) => {
    if (speedLabel) speedLabel.textContent = parseFloat(e.target.value).toFixed(2) + "x";
  });
}

document.querySelectorAll("[data-speed]").forEach((button) => {
  button.addEventListener("click", () => {
    if (!speedSlider) return;
    const speed = parseFloat(button.getAttribute("data-speed") || "0.95");
    speedSlider.value = String(speed);
    speedSlider.dispatchEvent(new Event("input"));
  });
});

/* ═══════════════════════════════════════════
   INITIALIZATION
   ═══════════════════════════════════════════ */

// Welcome message
if (chatBox) {
  addMessage(
    "[EN] Hi there! I'm your English speaking partner. Pick a topic above, or just start talking! I'll help you practice and improve. [/EN] [VI] Xin chào! Mình là đối tác luyện nói tiếng Anh của bạn. Chọn chủ đề ở trên, hoặc cứ bắt đầu nói! Mình sẽ giúp bạn luyện tập và cải thiện. [/VI] [SUGGEST] Tell me about yourself | What should we talk about? | Help me practice greetings [/SUGGEST]",
    "bot",
    { silent: true }
  );

  populateVoiceList();
  loadTopics();
}
