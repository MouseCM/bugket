/* public/js/interview.js — AI Interview Logic */

let interviewRoles = [];
let selectedRole = null;
let messages = [];

// DOM Elements
const roleGrid = document.getElementById("role-grid");
const chatBox = document.getElementById("chat-box");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const finishBtn = document.getElementById("finish-btn");
const micBtn = document.getElementById("voice-mic-btn");
const voiceWaves = document.getElementById("voice-waves");
const micStatus = document.getElementById("mic-status");

// Speech Recognition
let recognition = null;
let isRecording = false;
let finalTranscript = "";

function initSpeech() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    micStatus.textContent = "Trình duyệt không hỗ trợ Web Speech API.";
    return;
  }
  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = true;
  recognition.continuous = false;

  recognition.onstart = () => {
    isRecording = true;
    finalTranscript = "";
    chatInput.value = "";
    voiceWaves.classList.add("active");
    micBtn.classList.add("recording");
    micStatus.textContent = "Đang nghe...";
  };

  recognition.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interim += event.results[i][0].transcript;
      }
    }
    chatInput.value = finalTranscript + interim;
  };

  recognition.onerror = (event) => {
    console.error("[Speech]", event.error);
    micStatus.textContent = "Lỗi mic: " + event.error;
    stopRecording();
  };

  recognition.onend = () => {
    stopRecording();
    if (finalTranscript.trim().length > 0) {
      chatInput.value = finalTranscript;
      sendMessage();
    }
  };
}

function toggleRecording() {
  if (!recognition) return;
  if (isRecording) {
    recognition.stop();
  } else {
    recognition.start();
  }
}

function stopRecording() {
  isRecording = false;
  voiceWaves.classList.remove("active");
  micBtn.classList.remove("recording");
  micStatus.textContent = "Bấm mic để nói";
}

async function fetchRoles() {
  try {
    const res = await fetch("/api/interview/roles");
    const data = await res.json();
    interviewRoles = data.roles || [];
    renderRoles();
    if (interviewRoles.length > 0) {
      selectRole(interviewRoles[0].id);
    }
  } catch (err) {
    console.error(err);
  }
}

function renderRoles() {
  roleGrid.innerHTML = interviewRoles.map(r => `
    <div class="role-card" id="role-${r.id}" onclick="selectRole('${r.id}')">
      <div class="role-emoji">${r.emoji}</div>
      <div class="role-name">${r.name}</div>
    </div>
  `).join("");
}

function selectRole(id) {
  selectedRole = id;
  document.querySelectorAll(".role-card").forEach(el => el.classList.remove("active"));
  document.getElementById(`role-${id}`).classList.add("active");
  messages = [];
  chatBox.innerHTML = "";
  finishBtn.style.display = "none";
  addSystemMessage("Bạn đã chọn vị trí: " + interviewRoles.find(r => r.id === id).name + ". Hãy bắt đầu bằng một lời chào để nhà tuyển dụng phỏng vấn bạn!");
}

function addSystemMessage(text) {
  const div = document.createElement("div");
  div.className = "chat-msg model-msg";
  div.innerHTML = `<div class="msg-bubble system-bubble"><i>${text}</i></div>`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function addMessage(role, text) {
  messages.push({ role, text });
  if (messages.length > 0) finishBtn.style.display = "block";

  const div = document.createElement("div");
  div.className = role === "user" ? "chat-msg user-msg" : "chat-msg model-msg";

  // Parse [EN]...[/EN] [VI]...[/VI]
  let displayHtml = text;
  if (role === "model") {
    const enMatch = text.match(/\[EN\](.*?)\[\/EN\]/s);
    const viMatch = text.match(/\[VI\](.*?)\[\/VI\]/s);
    if (enMatch && viMatch) {
      displayHtml = `
        <div class="en-text">${enMatch[1].trim()}</div>
        <div class="vi-text small muted" style="margin-top: 8px; border-top: 1px solid var(--border-color); padding-top: 8px;">
          ${viMatch[1].trim()}
        </div>
      `;
    } else {
      displayHtml = `<div class="en-text">${text}</div>`;
    }
  } else {
    displayHtml = `<div class="en-text">${text}</div>`;
  }

  div.innerHTML = `
    <div class="msg-bubble">
      ${displayHtml}
    </div>
  `;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  addMessage("user", text);
  chatInput.value = "";
  chatInput.disabled = true;
  sendBtn.disabled = true;

  const typingDiv = document.createElement("div");
  typingDiv.className = "chat-msg model-msg";
  typingDiv.id = "typing-indicator";
  typingDiv.innerHTML = `<div class="msg-bubble"><i>Nhà tuyển dụng đang gõ...</i></div>`;
  chatBox.appendChild(typingDiv);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const res = await fetch("/api/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, messages: messages, roleId: selectedRole })
    });
    const data = await res.json();
    
    document.getElementById("typing-indicator")?.remove();
    
    if (data.reply) {
      addMessage("model", data.reply);
    } else if (data.error) {
      Swal.fire("Lỗi", data.error, "error");
    }
  } catch (err) {
    document.getElementById("typing-indicator")?.remove();
    Swal.fire("Lỗi", "Không thể kết nối đến server.", "error");
  } finally {
    chatInput.disabled = false;
    sendBtn.disabled = false;
    chatInput.focus();
  }
}

async function finishInterview() {
  if (messages.length < 2) {
    Swal.fire("Chưa đủ dữ liệu", "Vui lòng phỏng vấn thêm trước khi kết thúc.", "warning");
    return;
  }

  Swal.fire({
    title: "Đang đánh giá...",
    text: "AI đang phân tích buổi phỏng vấn của bạn.",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    const res = await fetch("/api/interview/grade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, roleId: selectedRole })
    });
    const data = await res.json();

    if (data.feedback) {
      Swal.fire({
        title: `Điểm số: ${data.score || 0}/100`,
        html: `<div style="text-align: left; font-size: 14px; max-height: 400px; overflow-y: auto;">
                 ${marked.parse ? marked.parse(data.feedback) : data.feedback.replace(/\n/g, '<br/>')}
               </div>`,
        icon: "success",
        width: 600
      });
    } else {
      Swal.fire("Lỗi", data.error || "Không thể lấy kết quả.", "error");
    }
  } catch (err) {
    Swal.fire("Lỗi", "Không thể kết nối đến server.", "error");
  }
}

// Event Listeners
micBtn.addEventListener("click", toggleRecording);
sendBtn.addEventListener("click", sendMessage);
chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});
finishBtn.addEventListener("click", finishInterview);

// Init
initSpeech();
fetchRoles();
