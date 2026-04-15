async function loadWordIntent() {
  const box = document.getElementById("word-intent-box");
  if (!box) return;

  try {
    const res = await fetch("/api/words");
    const data = await res.json();
    const words = data.words || [];
    if (!words.length) return;

    const item = words[Math.floor(Math.random() * words.length)];
    box.innerHTML = `
      <p class="small muted">Từ vựng hôm nay</p>
      <h3>${item.english}</h3>
      <p><strong>Nghĩa:</strong> ${item.vietnamese}</p>
      <p class="muted"><strong>Cách dùng:</strong> ${item.example}</p>
    `;
  } catch (_error) {
    box.innerHTML = "<p class='muted'>Không tải được từ vựng lúc này.</p>";
  }
}

loadWordIntent();
