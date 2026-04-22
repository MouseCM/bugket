/* bugket — Dashboard JS */

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const userRaw = localStorage.getItem("user");

  if (!token || !userRaw) {
    window.location.href = "/login.html";
    return;
  }

  let cachedUser = null;
  try {
    cachedUser = JSON.parse(userRaw);
  } catch (_error) {
    localStorage.removeItem("user");
  }

  const greetingEl = document.getElementById("dashboard-greeting");
  const streakEl = document.getElementById("stat-streak");
  const wordsLearnedEl = document.getElementById("stat-words-learned");
  const estimatedLevelEl = document.getElementById("stat-estimated-level");

  function renderUserProgress(user) {
    const safeName = String(user?.name || "").trim();
    const safeStreak = Number.isFinite(Number(user?.streak)) ? Math.max(0, Number(user.streak)) : 0;
    const safeWordsLearned = Number.isFinite(Number(user?.wordsLearned)) ? Math.max(0, Number(user.wordsLearned)) : 0;
    const safeLevel = String(user?.estimatedLevel || "A1").trim().toUpperCase() || "A1";

    if (greetingEl && safeName) {
      greetingEl.textContent = `Xin chào, ${safeName}!`;
    }
    if (streakEl) streakEl.textContent = `${safeStreak} ngày`;
    if (wordsLearnedEl) wordsLearnedEl.textContent = `${safeWordsLearned} từ`;
    if (estimatedLevelEl) estimatedLevelEl.textContent = safeLevel;
  }

  if (cachedUser) {
    renderUserProgress(cachedUser);
  }

  try {
    const meResponse = await fetch("/api/user/me", {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (meResponse.ok) {
      const meData = await meResponse.json();
      if (meData?.user) {
        renderUserProgress(meData.user);
        localStorage.setItem("user", JSON.stringify({ ...(cachedUser || {}), ...meData.user }));
      }
    }
  } catch (_error) {
    // Keep cached UI state if profile request fails.
  }

  const rankingHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const [wordsResult, topicsResult, rankingResult] = await Promise.allSettled([
    fetch("/api/words").then((res) => res.json()),
    fetch("/api/conversation-topics").then((res) => res.json()),
    fetch("/api/user/rankings", { headers: rankingHeaders }).then(async (res) => {
      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        return {
          ok: false,
          error: payload?.error || `HTTP ${res.status}`
        };
      }

      return {
        ok: true,
        rankings: payload?.rankings || {}
      };
    })
  ]);

  const words = wordsResult.status === "fulfilled" ? wordsResult.value.words || [] : [];
  const topics = topicsResult.status === "fulfilled" ? topicsResult.value.topics || [] : [];
  const rankingState = rankingResult.status === "fulfilled"
    ? rankingResult.value
    : { ok: false, error: "Không tải được bảng xếp hạng." };
  const rankings = rankingState.ok ? rankingState.rankings || {} : {};

  const statWords = document.getElementById("stat-words");
  const statTopics = document.getElementById("stat-topics");
  if (statWords) statWords.textContent = String(words.length);
  if (statTopics) statTopics.textContent = String(topics.length);

  function renderRankingList(listId, items, formatValue, errorMessage) {
    const listEl = document.getElementById(listId);
    if (!listEl) return;

    listEl.innerHTML = "";
    if (errorMessage) {
      const error = document.createElement("li");
      error.className = "dashboard-ranking-empty";
      error.textContent = errorMessage;
      listEl.appendChild(error);
      return;
    }

    if (!Array.isArray(items) || !items.length) {
      const empty = document.createElement("li");
      empty.className = "dashboard-ranking-empty";
      empty.textContent = "Chưa có dữ liệu xếp hạng.";
      listEl.appendChild(empty);
      return;
    }

    items.forEach((item) => {
      const li = document.createElement("li");
      li.className = "dashboard-ranking-item";
      if (item?.isCurrentUser) li.classList.add("is-you");

      const rank = document.createElement("span");
      rank.className = "dashboard-ranking-rank";
      rank.textContent = `#${item.rank || "-"}`;

      const userName = document.createElement("span");
      userName.className = "dashboard-ranking-name";
      userName.textContent = String(item?.name || "Ẩn danh");

      const value = document.createElement("span");
      value.className = "dashboard-ranking-value";
      value.textContent = formatValue(item?.value);

      li.appendChild(rank);
      li.appendChild(userName);
      li.appendChild(value);

      if (item?.isCurrentUser) {
        const youTag = document.createElement("span");
        youTag.className = "dashboard-ranking-you";
        youTag.textContent = "Bạn";
        li.appendChild(youTag);
      }

      listEl.appendChild(li);
    });
  }

  const rankingErrorMessage = rankingState.ok ? "" : "Không tải được bảng xếp hạng.";
  renderRankingList("ranking-words", rankings.words || [], (value) => `${Number(value) || 0} từ`, rankingErrorMessage);
  renderRankingList("ranking-streak", rankings.streak || [], (value) => `${Number(value) || 0} ngày`, rankingErrorMessage);
  renderRankingList("ranking-level", rankings.level || [], (value) => String(value || "A1").toUpperCase(), rankingErrorMessage);

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
