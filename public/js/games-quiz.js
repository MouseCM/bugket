const quizWordEl = document.getElementById("quiz-word");
const quizOptionsEl = document.getElementById("quiz-options");
const nextQuizBtn = document.getElementById("next-quiz");
const quizResultEl = document.getElementById("quiz-result");
const scoreEl = document.getElementById("score-quiz");
const attemptEl = document.getElementById("attempt-quiz");
const levelEl = document.getElementById("level-quiz");
const levelRowEl = document.getElementById("level-row-quiz");

let vocabWords = [];
let quizAnswer = "";
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

function renderRound() {
  const picked = vocabWords[Math.floor(Math.random() * vocabWords.length)];
  quizAnswer = picked.vietnamese;
  quizWordEl.textContent = picked.english;
  quizResultEl.textContent = "";
  quizResultEl.style.color = "";

  const wrongs = shuffle(vocabWords.filter((w) => w.vietnamese !== quizAnswer))
    .slice(0, 3)
    .map((w) => w.vietnamese);
  const options = shuffle([quizAnswer, ...wrongs]);

  quizOptionsEl.innerHTML = "";
  options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = opt;
    btn.addEventListener("click", () => {
      attempts += 1;
      const all = quizOptionsEl.querySelectorAll(".option-btn");
      all.forEach((b) => (b.disabled = true));
      if (opt === quizAnswer) {
        btn.classList.add("correct");
        quizResultEl.textContent = "Đúng rồi! Bạn chọn chính xác.";
        quizResultEl.style.color = "#33d17a";
        score += 1;
      } else {
        btn.classList.add("wrong");
        all.forEach((b) => {
          if (b.textContent === quizAnswer) b.classList.add("correct");
        });
        quizResultEl.textContent = `Chưa đúng. Đáp án là: ${quizAnswer}`;
        quizResultEl.style.color = "#ff6a88";
      }
      renderStats();
    });
    quizOptionsEl.appendChild(btn);
  });
}

nextQuizBtn?.addEventListener("click", renderRound);

async function init() {
  const res = await fetch("/api/words");
  const data = await res.json();
  vocabWords = data.words || [];
  renderRound();
  renderStats();
}

init();
