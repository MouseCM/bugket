async function loadStats() {
  try {
    const res = await fetch("/api/words");
    const data = await res.json();
    const el = document.getElementById("kpi-words");
    if (el) el.textContent = String(data.words?.length || 0);
  } catch (_error) {
    const el = document.getElementById("kpi-words");
    if (el) el.textContent = "-";
  }
}

loadStats();
