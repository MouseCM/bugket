/* bugket — Home Dashboard Logic */

function showSection(element, isVisible) {
  if (!element) return;
  element.style.display = isVisible ? "" : "none";
}

function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("email");
}

function getCachedUser() {
  try {
    const userRaw = localStorage.getItem("user");
    return userRaw ? JSON.parse(userRaw) : null;
  } catch (_error) {
    localStorage.removeItem("user");
    return null;
  }
}

function hydrateFromLocalUser() {
  const user = getCachedUser();
  if (!user) return;

  const welcome = document.getElementById("dashboard-welcome");
  const streak = document.getElementById("kpi-streak");
  const words = document.getElementById("kpi-wordsLearned");
  const level = document.getElementById("kpi-level");

  if (welcome && user.name) welcome.textContent = `Chào bạn, ${user.name}!`;
  if (streak && Number.isFinite(user.streak)) streak.textContent = `${user.streak}🔥`;
  if (words && Number.isFinite(user.wordsLearned)) words.textContent = String(user.wordsLearned);
  if (level && user.estimatedLevel) level.textContent = user.estimatedLevel;
}

async function loadHome() {
  const token = localStorage.getItem("token");
  const guestHero = document.getElementById("guest-hero");
  const userDashboard = document.getElementById("user-dashboard");

  if (!token) {
    showSection(guestHero, true);
    showSection(userDashboard, false);
    return;
  }

  showSection(guestHero, false);
  showSection(userDashboard, true);
  hydrateFromLocalUser();

  try {
    const response = await fetch("/api/user/me", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await response.json();

    if (!response.ok || !data.user) {
      clearSession();
      showSection(guestHero, true);
      showSection(userDashboard, false);
      return;
    }

    const { user } = data;
    const cachedUser = getCachedUser();
    const safeUser = {
      id: Number(user.id) || Number(cachedUser?.id) || undefined,
      name: user.name || "Bạn",
      streak: Number(user.streak) || 0,
      wordsLearned: Number(user.wordsLearned) || 0,
      estimatedLevel: user.estimatedLevel || "A1"
    };

    localStorage.setItem("user", JSON.stringify(safeUser));

    const welcome = document.getElementById("dashboard-welcome");
    const streak = document.getElementById("kpi-streak");
    const words = document.getElementById("kpi-wordsLearned");
    const level = document.getElementById("kpi-level");

    if (welcome) welcome.textContent = `Chào bạn, ${safeUser.name}!`;
    if (streak) streak.textContent = `${safeUser.streak}🔥`;
    if (words) words.textContent = String(safeUser.wordsLearned);
    if (level) level.textContent = safeUser.estimatedLevel;
  } catch (_error) {
    // Keep local fallback if network fails.
  }
}

document.addEventListener("DOMContentLoaded", loadHome);
