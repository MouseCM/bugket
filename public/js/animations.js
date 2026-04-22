/* bugket — Global UI Animations */

(function initAnimations() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  const doc = document.documentElement;

  // Subtle ambient parallax from pointer movement.
  let frame = null;
  let targetX = 0.5;
  let targetY = 0.5;

  function updateAmbientVars() {
    frame = null;
    doc.style.setProperty("--mx", targetX.toFixed(3));
    doc.style.setProperty("--my", targetY.toFixed(3));
  }

  window.addEventListener("pointermove", (event) => {
    const width = window.innerWidth || 1;
    const height = window.innerHeight || 1;
    targetX = Math.min(1, Math.max(0, event.clientX / width));
    targetY = Math.min(1, Math.max(0, event.clientY / height));

    if (!frame) frame = requestAnimationFrame(updateAmbientVars);
  }, { passive: true });

  const targets = Array.from(
    document.querySelectorAll(
      ".section, .card, .dashboard-stat-card, .word-item, .game-panel, .game-meta-card"
    )
  ).filter((el) => !el.classList.contains("reveal"));

  targets.forEach((el, index) => {
    el.classList.add("reveal");
    const delayClass = `reveal-delay-${(index % 4) + 1}`;
    el.classList.add(delayClass);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { root: null, rootMargin: "0px 0px -5% 0px", threshold: 0 }
  );

  targets.forEach((el) => observer.observe(el));
  targets.slice(0, 3).forEach((el) => el.classList.add("is-visible"));

  // Count-up animation for static numeric stats.
  const numberCandidates = document.querySelectorAll(
    ".stat-value, .ds-value, .hero-metric strong, .game-stat-value"
  );

  function animateNumber(el) {
    if (!el || el.dataset.counted === "1") return;

    const raw = (el.textContent || "").trim();
    const match = raw.match(/^(\d+)([^\d]*)$/);
    if (!match) return;

    const endValue = Number.parseInt(match[1], 10);
    const suffix = match[2] || "";
    if (!Number.isFinite(endValue) || endValue <= 0) return;

    el.dataset.counted = "1";
    const duration = Math.min(1200, Math.max(500, endValue * 24));
    const startTime = performance.now();

    function tick(now) {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.max(1, Math.floor(endValue * eased));
      el.textContent = `${current}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  const numberObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateNumber(entry.target);
          numberObserver.unobserve(entry.target);
        }
      });
    },
    { root: null, rootMargin: "0px 0px -12% 0px", threshold: 0.25 }
  );

  numberCandidates.forEach((el) => numberObserver.observe(el));
})();
