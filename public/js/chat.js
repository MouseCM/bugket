const chatBox = document.getElementById("chat-box");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function formatBotMessage(text) {
  const safe = escapeHtml(text);
  return safe
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^\* (.+)$/gm, "• $1")
    .replace(/\n/g, "<br>");
}

function addMessage(text, who) {
  const div = document.createElement("div");
  div.className = `bubble ${who}`;
  if (who === "bot") {
    div.innerHTML = formatBotMessage(text);
  } else {
    div.textContent = text;
  }
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
  const message = chatInput.value.trim();
  if (!message) return;
  addMessage(message, "user");
  chatInput.value = "";

  addMessage("Đang suy nghĩ...", "bot");
  const loading = chatBox.lastChild;

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await res.json();
    loading.remove();
    if (!res.ok) {
      const errorText = [data.error, data.hint, data.code ? `Mã lỗi: ${data.code}` : null]
        .filter(Boolean)
        .join("\n");
      addMessage(errorText || "Lỗi khi gọi API.", "bot");
      return;
    }

    addMessage(data.reply || "Không có phản hồi.", "bot");
  } catch (_error) {
    loading.remove();
    addMessage("Không thể kết nối đến máy chủ.", "bot");
  }
}

sendBtn?.addEventListener("click", sendMessage);
chatInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

addMessage("Xin chào! Tôi là trợ giảng AI, bạn muốn học chủ đề nào?", "bot");
