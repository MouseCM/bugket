function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function loadWordIntent() {
  const box = document.getElementById("word-intent-box");
  const grid = document.getElementById("home-vocab-grid");

  if (!box && !grid) return;

  try {
    const res = await fetch("/api/words");
    const data = await res.json();
    const words = data.words || [];
    if (!words.length) return;

    if (box) {
      const item = words[Math.floor(Math.random() * words.length)];
      box.innerHTML = `
        <p class="small muted">Từ vựng hôm nay</p>
        <h3>${escapeHtml(item.english)}</h3>
        <div class="small muted" style="margin: 6px 0 10px;">IPA: ${escapeHtml(item.ipa || "—")}</div>
        <p class="small"><strong>Nghĩa:</strong> ${escapeHtml(item.vietnamese)}</p>
        <p class="muted small" style="margin-top:6px;"><strong>Ví dụ:</strong> ${escapeHtml(item.example)}</p>
      `;
    }

    if (grid) {
      const levelOrder = ["A1", "A2", "B1", "B2", "C1"];
      const sorted = [...words].sort((a, b) => {
        const ai = levelOrder.indexOf(a.level);
        const bi = levelOrder.indexOf(b.level);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      });

      grid.innerHTML = "";
      const fragment = document.createDocumentFragment();

      sorted.slice(0, 100).forEach((item) => {
        const div = document.createElement("div");
        div.className = "word-item home-vocab-item";

        const en = document.createElement("strong");
        en.textContent = item.english;
        div.appendChild(en);

        if (item.ipa) {
          const ipa = document.createElement("div");
          ipa.className = "small muted";
          ipa.textContent = `IPA: ${item.ipa}`;
          div.appendChild(ipa);
        }

        const vi = document.createElement("p");
        vi.className = "small";
        vi.textContent = item.vietnamese;
        div.appendChild(vi);

        const level = document.createElement("div");
        level.className = "small muted";
        level.textContent = `Level: ${item.level}`;
        div.appendChild(level);

        fragment.appendChild(div);
      });

      grid.appendChild(fragment);
    }
  } catch (_error) {
    if (box) box.innerHTML = "<p class='muted'>Không tải được từ vựng lúc này.</p>";
  }
}

loadWordIntent();
