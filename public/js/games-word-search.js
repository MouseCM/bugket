const gridEl = document.getElementById("puzzle-grid");
const targetWordsEl = document.getElementById("target-words");
const puzzleResult = document.getElementById("puzzle-result");
const currentSelectionEl = document.getElementById("current-selection");
const submitPuzzleBtn = document.getElementById("submit-puzzle");
const clearPuzzleBtn = document.getElementById("clear-puzzle");
const scoreEl = document.getElementById("score-word-search");
const attemptEl = document.getElementById("attempt-word-search");
const levelEl = document.getElementById("level-word-search");
const levelRowEl = document.getElementById("level-row-word-search");

const GRID_SIZE = 10;
let puzzleWords = [];
let gridData = [];
let selectedIndices = [];
let foundWords = new Set();
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

function randomLetter() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return letters[Math.floor(Math.random() * letters.length)];
}

function buildGrid(words) {
  const grid = Array.from({ length: GRID_SIZE * GRID_SIZE }, () => randomLetter());
  words.forEach((word, row) => {
    const start = (row + 1) * GRID_SIZE;
    for (let i = 0; i < word.length && i < GRID_SIZE; i += 1) {
      grid[start + i] = word[i];
    }
  });
  return grid;
}

function selectedWord() {
  return selectedIndices.map((i) => gridData[i]).join("");
}

function updateCurrentSelection() {
  currentSelectionEl.textContent = selectedWord() || "-";
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

submitPuzzleBtn?.addEventListener("click", () => {
  const picked = selectedWord();
  if (!picked) {
    puzzleResult.textContent = "Bạn chưa chọn ô nào.";
    puzzleResult.style.color = "#fbbf24";
    return;
  }
  attempts += 1;
  if (puzzleWords.includes(picked) && !foundWords.has(picked)) {
    foundWords.add(picked);
    score += 1;
    selectedIndices.forEach((i) => {
      const c = gridEl.children[i];
      c.classList.remove("selected");
      c.classList.add("found");
    });
    selectedIndices = [];
    updateCurrentSelection();
    puzzleResult.textContent = `Tuyệt vời! Bạn đã tìm được: ${picked}`;
    puzzleResult.style.color = "#33d17a";
  } else if (foundWords.has(picked)) {
    puzzleResult.textContent = `Từ "${picked}" bạn đã tìm rồi.`;
    puzzleResult.style.color = "#fbbf24";
    clearSelection();
  } else {
    puzzleResult.textContent = `"${picked}" chưa đúng. Thử lại nhé!`;
    puzzleResult.style.color = "#ff6a88";
    clearSelection();
  }
  if (foundWords.size === puzzleWords.length) {
    puzzleResult.textContent = "Bạn đã hoàn thành tất cả từ! Chúc mừng!";
    puzzleResult.style.color = "#33d17a";
  }
  renderStats();
});

clearPuzzleBtn?.addEventListener("click", clearSelection);

async function init() {
  const res = await fetch("/api/games/word-search");
  const data = await res.json();
  puzzleWords = (data.words || []).map((w) => w.toUpperCase());
  targetWordsEl.textContent = `Từ cần tìm: ${puzzleWords.join(", ")}`;
  gridData = buildGrid(puzzleWords);
  renderGrid();
  updateCurrentSelection();
  renderStats();
}

init();
