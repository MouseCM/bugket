const matchEnglishEl = document.getElementById("match-english");
const matchVietnameseEl = document.getElementById("match-vietnamese");
const resetMatchBtn = document.getElementById("reset-match");
const matchResultEl = document.getElementById("match-result");
const scoreEl = document.getElementById("score-match");
const attemptEl = document.getElementById("attempt-match");
const levelEl = document.getElementById("level-match");
const levelRowEl = document.getElementById("level-row-match");

let vocabWords = [];
let selectedEnglish = null;
let selectedVietnamese = null;
let matchedPairs = new Set();
let score = 0;
let attempts = 0;

function getLevelText() {
  const ratio = attempts ? (score / attempts) * 100 : 0;
  if (ratio >= 80) return "Bạn rất tốt";
  if (ratio >= 50) return "Bạn khá tốt";
  return "Bạn cần luyện tập thêm";
}

function renderStats() {
  scoreEl.textContent = String(score);
  attemptEl.textContent = String(attempts);
  if (attempts > 0) {
    levelEl.textContent = getLevelText();
    levelRowEl.style.display = "";
  } else {
    levelEl.textContent = "";
    levelRowEl.style.display = "none";
  }
}

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function checkMatch() {
  if (!selectedEnglish || !selectedVietnamese) return;
  attempts += 1;
  const match = vocabWords.find((w) => w.english === selectedEnglish);

  if (match && match.vietnamese === selectedVietnamese) {
    matchedPairs.add(selectedEnglish);
    score += 1;
    const eBtn = [...matchEnglishEl.querySelectorAll(".chip-btn")].find((b) => b.dataset.value === selectedEnglish);
    const vBtn = [...matchVietnameseEl.querySelectorAll(".chip-btn")].find((b) => b.dataset.value === selectedVietnamese);
    if (eBtn) {
      eBtn.classList.remove("selected");
      eBtn.classList.add("matched");
      eBtn.disabled = true;
    }
    if (vBtn) {
      vBtn.classList.remove("selected");
      vBtn.classList.add("matched");
      vBtn.disabled = true;
    }
    matchResultEl.textContent = "Ghép đúng! Tiếp tục nào.";
  } else {
    matchResultEl.textContent = "Sai cặp rồi, thử lại nhé.";
    matchEnglishEl.querySelectorAll(".chip-btn").forEach((b) => b.classList.remove("selected"));
    matchVietnameseEl.querySelectorAll(".chip-btn").forEach((b) => b.classList.remove("selected"));
  }

  selectedEnglish = null;
  selectedVietnamese = null;

  const total = matchEnglishEl.querySelectorAll(".chip-btn").length;
  if (matchedPairs.size === total) {
    matchResultEl.textContent = "Bạn đã ghép đúng tất cả cặp từ. Tuyệt vời!";
  }
  renderStats();
}

function renderMatchGame() {
  const subset = shuffle(vocabWords).slice(0, 5);
  const englishList = subset.map((w) => ({ english: w.english, vietnamese: w.vietnamese }));
  const vietnameseList = shuffle(subset.map((w) => ({ english: w.english, vietnamese: w.vietnamese })));

  selectedEnglish = null;
  selectedVietnamese = null;
  matchedPairs = new Set();
  matchResultEl.textContent = "";
  score = 0;
  attempts = 0;
  renderStats();

  matchEnglishEl.innerHTML = "";
  englishList.forEach((item) => {
    const btn = document.createElement("button");
    btn.className = "chip-btn";
    btn.textContent = item.english;
    btn.dataset.value = item.english;
    btn.addEventListener("click", () => {
      if (btn.classList.contains("matched")) return;
      matchEnglishEl.querySelectorAll(".chip-btn").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedEnglish = item.english;
      checkMatch();
    });
    matchEnglishEl.appendChild(btn);
  });

  matchVietnameseEl.innerHTML = "";
  vietnameseList.forEach((item) => {
    const btn = document.createElement("button");
    btn.className = "chip-btn";
    btn.textContent = item.vietnamese;
    btn.dataset.value = item.vietnamese;
    btn.addEventListener("click", () => {
      if (btn.classList.contains("matched")) return;
      matchVietnameseEl.querySelectorAll(".chip-btn").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedVietnamese = item.vietnamese;
      checkMatch();
    });
    matchVietnameseEl.appendChild(btn);
  });
}

resetMatchBtn?.addEventListener("click", renderMatchGame);

async function init() {
  const res = await fetch("/api/words");
  const data = await res.json();
  vocabWords = data.words || [];
  renderMatchGame();
}

init();
