/* bugket — Dashboard JS */

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const userRaw = localStorage.getItem("user");

  if (!token || !userRaw) {
    window.location.href = "/login.html";
    return;
  }

  try {
    const user = JSON.parse(userRaw);
    const greetingEl = document.getElementById("dashboard-greeting");
    if (greetingEl && user?.name) {
      greetingEl.textContent = `Xin chào, ${user.name}!`;
    }
  } catch (_error) {
    localStorage.removeItem("user");
  }

  const [wordsResult, topicsResult] = await Promise.allSettled([
    fetch("/api/words").then((res) => res.json()),
    fetch("/api/conversation-topics").then((res) => res.json())
  ]);

  const words = wordsResult.status === "fulfilled" ? wordsResult.value.words || [] : [];
  const topics = topicsResult.status === "fulfilled" ? topicsResult.value.topics || [] : [];

  const statWords = document.getElementById("stat-words");
  const statTopics = document.getElementById("stat-topics");
  if (statWords) statWords.textContent = String(words.length);
  if (statTopics) statTopics.textContent = String(topics.length);

  const grid = document.getElementById("word-preview");
  if (!grid) return;

  grid.innerHTML = "";

  const sample = words.slice(0, 24);
  if (!sample.length) {
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.textContent = "Chưa tải được dữ liệu từ vựng.";
    grid.appendChild(empty);
    return;
  }

  sample.forEach((word) => {
    const chip = document.createElement("div");
    chip.className = "dashboard-word-chip";

    const english = document.createElement("strong");
    english.textContent = String(word.english || "-");

    const vietnamese = document.createElement("span");
    vietnamese.textContent = String(word.vietnamese || "-");

    const level = document.createElement("span");
    level.className = "game-badge";
    level.textContent = String(word.level || "A1");

    chip.appendChild(english);
    chip.appendChild(vietnamese);
    chip.appendChild(level);
    grid.appendChild(chip);
  });
});
