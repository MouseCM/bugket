const scrambledEl = document.getElementById("scrambled");
const guessInput = document.getElementById("guess-input");
const checkGuessBtn = document.getElementById("check-guess");
const newRoundBtn = document.getElementById("new-round");
const guessResult = document.getElementById("guess-result");
const scoreEl = document.getElementById("score-unscramble");
const attemptEl = document.getElementById("attempt-unscramble");
const levelEl = document.getElementById("level-unscramble");
const levelRowEl = document.getElementById("level-row-unscramble");

let words = [];
let currentWord = "";
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

function shuffleWord(word) {
  const arr = word.split("");
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join("");
}

function setRound() {
  currentWord = words[Math.floor(Math.random() * words.length)];
  scrambledEl.textContent = shuffleWord(currentWord);
  guessInput.value = "";
  guessResult.textContent = "";
}

checkGuessBtn?.addEventListener("click", () => {
  const answer = guessInput.value.trim().toUpperCase();
  attempts += 1;
  if (answer === currentWord) {
    guessResult.textContent = "Chính xác! Bạn giỏi quá.";
    guessResult.style.color = "#33d17a";
    score += 1;
  } else {
    guessResult.textContent = "Chưa đúng. Thử lại nhé.";
    guessResult.style.color = "#ff6a88";
  }
  renderStats();
});

newRoundBtn?.addEventListener("click", setRound);

async function init() {
  const res = await fetch("/api/games/word-search");
  const data = await res.json();
  words = (data.words || []).map((w) => w.toUpperCase());
  setRound();
  renderStats();
}

init();
