const flashWord = document.getElementById("flash-word");
const flashMeaning = document.getElementById("flash-meaning");
const flashExample = document.getElementById("flash-example");
const nextWordBtn = document.getElementById("next-word");
const wordList = document.getElementById("word-list");
const learnTotalWords = document.getElementById("learn-total-words");
const learnStatus = document.getElementById("learn-status");

let words = [];
let index = 0;

function renderFlashcard() {
  if (!words.length) return;
  const item = words[index];
  flashWord.textContent = item.english;
  flashMeaning.textContent = `Nghĩa: ${item.vietnamese} | Cấp độ: ${item.level}`;
  flashExample.textContent = `Ví dụ: ${item.example}`;
}

function renderList() {
  wordList.innerHTML = "";
  words.forEach((item) => {
    const div = document.createElement("div");
    div.className = "word-item";
    div.innerHTML = `<strong>${item.english}</strong><p class=\"small muted\">${item.vietnamese}</p><p class=\"small\">${item.example}</p>`;
    wordList.appendChild(div);
  });
}

nextWordBtn?.addEventListener("click", () => {
  index = (index + 1) % words.length;
  renderFlashcard();
});

async function init() {
  const res = await fetch("/api/words");
  const data = await res.json();
  words = data.words || [];
  if (learnTotalWords) learnTotalWords.textContent = String(words.length);
  if (learnStatus) learnStatus.textContent = words.length >= 10 ? "Sẵn sàng luyện tập" : "Tiếp tục bổ sung từ";
  renderFlashcard();
  renderList();
}

init();
