const gridEl = document.getElementById("puzzle-grid");
const targetWordsEl = document.getElementById("target-words");
const puzzleResult = document.getElementById("puzzle-result");
const currentSelectionEl = document.getElementById("current-selection");
const submitPuzzleBtn = document.getElementById("submit-puzzle");
const clearPuzzleBtn = document.getElementById("clear-puzzle");

const scrambledEl = document.getElementById("scrambled");
const guessInput = document.getElementById("guess-input");
const checkGuessBtn = document.getElementById("check-guess");
const newRoundBtn = document.getElementById("new-round");
const guessResult = document.getElementById("guess-result");
const quizWordEl = document.getElementById("quiz-word");
const quizOptionsEl = document.getElementById("quiz-options");
const nextQuizBtn = document.getElementById("next-quiz");
const quizResultEl = document.getElementById("quiz-result");
const matchEnglishEl = document.getElementById("match-english");
const matchVietnameseEl = document.getElementById("match-vietnamese");
const resetMatchBtn = document.getElementById("reset-match");
const matchResultEl = document.getElementById("match-result");

const GRID_SIZE = 10;
let puzzleWords = [];
let gridData = [];
let selectedIndices = [];
let foundWords = new Set();

let currentWord = "";
let vocabWords = [];
let quizAnswer = "";
let selectedEnglish = null;
let selectedVietnamese = null;
let matchedPairs = new Set();

function randomLetter() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return letters[Math.floor(Math.random() * letters.length)];
}

function buildGrid(words) {
  const grid = Array.from({ length: GRID_SIZE * GRID_SIZE }, () => randomLetter());

  words.forEach((word, row) => {
    const safeRow = row + 1;
    const start = safeRow * GRID_SIZE;
    for (let i = 0; i < word.length && i < GRID_SIZE; i += 1) {
      grid[start + i] = word[i];
    }
  });

  return grid;
}

function renderGrid() {
  gridEl.innerHTML = "";
  gridData.forEach((ch, idx) => {
    const cell = document.createElement("button");
    cell.className = "cell";
    cell.textContent = ch;
    cell.addEventListener("click", () => onPick(idx, cell));
    gridEl.appendChild(cell);
  });
}

function selectedWord() {
  return selectedIndices.map((i) => gridData[i]).join("");
}

function updateCurrentSelection() {
  const picked = selectedWord();
  currentSelectionEl.textContent = picked || "-";
}

function clearSelection() {
  selectedIndices.forEach((i) => {
    const c = gridEl.children[i];
    if (!c.classList.contains("found")) c.classList.remove("selected");
  });
  selectedIndices = [];
  updateCurrentSelection();
}

function onPick(index, cell) {
  if (cell.classList.contains("found")) return;
  cell.classList.toggle("selected");

  if (cell.classList.contains("selected")) {
    selectedIndices.push(index);
  } else {
    selectedIndices = selectedIndices.filter((i) => i !== index);
  }
  updateCurrentSelection();
}

submitPuzzleBtn?.addEventListener("click", () => {
  const picked = selectedWord();
  if (!picked) {
    puzzleResult.textContent = "Bạn chưa chọn ô nào.";
    return;
  }

  if (puzzleWords.includes(picked) && !foundWords.has(picked)) {
    foundWords.add(picked);
    selectedIndices.forEach((i) => {
      const c = gridEl.children[i];
      c.classList.remove("selected");
      c.classList.add("found");
    });
    selectedIndices = [];
    updateCurrentSelection();
    puzzleResult.textContent = `Tuyệt vời! Bạn đã tìm được: ${picked}`;
  } else if (foundWords.has(picked)) {
    puzzleResult.textContent = `Từ \"${picked}\" bạn đã tìm rồi.`;
    clearSelection();
  } else {
    puzzleResult.textContent = `\"${picked}\" chưa đúng. Thử lại nhé!`;
    clearSelection();
  }

  if (foundWords.size === puzzleWords.length) {
    puzzleResult.textContent = "Bạn đã hoàn thành tất cả từ! Chúc mừng!";
  }
});

clearPuzzleBtn?.addEventListener("click", clearSelection);

function shuffleWord(word) {
  const arr = word.split("");
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join("");
}

function setRound() {
  currentWord = puzzleWords[Math.floor(Math.random() * puzzleWords.length)];
  scrambledEl.textContent = shuffleWord(currentWord);
  guessInput.value = "";
  guessResult.textContent = "";
}

checkGuessBtn?.addEventListener("click", () => {
  const answer = guessInput.value.trim().toUpperCase();
  if (answer === currentWord) {
    guessResult.textContent = "Chính xác! Bạn giỏi quá.";
    guessResult.style.color = "#33d17a";
  } else {
    guessResult.textContent = "Chưa đúng. Thử lại nhé.";
    guessResult.style.color = "#ff6a88";
  }
});

newRoundBtn?.addEventListener("click", setRound);

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function renderQuizRound() {
  if (!vocabWords.length) return;
  const picked = vocabWords[Math.floor(Math.random() * vocabWords.length)];
  quizAnswer = picked.vietnamese;
  quizWordEl.textContent = picked.english;
  quizResultEl.textContent = "";

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
      const all = quizOptionsEl.querySelectorAll(".option-btn");
      all.forEach((b) => (b.disabled = true));
      if (opt === quizAnswer) {
        btn.classList.add("correct");
        quizResultEl.textContent = "Đúng rồi! Bạn chọn chính xác.";
      } else {
        btn.classList.add("wrong");
        all.forEach((b) => {
          if (b.textContent === quizAnswer) b.classList.add("correct");
        });
        quizResultEl.textContent = `Chưa đúng. Đáp án là: ${quizAnswer}`;
      }
    });
    quizOptionsEl.appendChild(btn);
  });
}

function renderMatchGame() {
  const subset = shuffle(vocabWords).slice(0, 5);
  const englishList = subset.map((w) => ({ english: w.english, vietnamese: w.vietnamese }));
  const vietnameseList = shuffle(subset.map((w) => ({ english: w.english, vietnamese: w.vietnamese })));

  selectedEnglish = null;
  selectedVietnamese = null;
  matchedPairs = new Set();
  matchResultEl.textContent = "";

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
      checkMatch(item.vietnamese);
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
      checkMatch(item.vietnamese);
    });
    matchVietnameseEl.appendChild(btn);
  });
}

function checkMatch(currentVietnamese) {
  if (!selectedEnglish || !selectedVietnamese) return;
  const match = vocabWords.find((w) => w.english === selectedEnglish);
  if (match && match.vietnamese === selectedVietnamese) {
    matchedPairs.add(selectedEnglish);
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
}

nextQuizBtn?.addEventListener("click", renderQuizRound);
resetMatchBtn?.addEventListener("click", renderMatchGame);

async function init() {
  const [puzzleRes, vocabRes] = await Promise.all([fetch("/api/games/word-search"), fetch("/api/words")]);
  const puzzleData = await puzzleRes.json();
  const vocabData = await vocabRes.json();
  puzzleWords = (puzzleData.words || []).map((w) => w.toUpperCase());
  vocabWords = vocabData.words || [];

  targetWordsEl.textContent = `Từ cần tìm: ${puzzleWords.join(", ")}`;
  gridData = buildGrid(puzzleWords);
  renderGrid();
  updateCurrentSelection();
  setRound();
  renderQuizRound();
  renderMatchGame();
}

init();
