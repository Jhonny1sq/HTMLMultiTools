// PRISM — interactive wiring
(() => {
  "use strict";

  // year stamp
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // mobile nav toggle
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    // close on link tap
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      })
    );
  }

  // live tool counter — reads data-tools on body, defaults to count of cards
  const statTools = document.getElementById("stat-tools");
  if (statTools) {
    const cards = document.querySelectorAll(".tool-card");
    const target = Number(document.body.dataset.tools) || cards.length;
    let current = 0;
    const step = () => {
      current += Math.max(1, Math.ceil((target - current) / 8));
      if (current > target) current = target;
      statTools.textContent = String(current);
      if (current < target) requestAnimationFrame(step);
    };
    step();
  }

  // subtle scroll reveal
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduceMotion && "IntersectionObserver" in window) {
    const targets = document.querySelectorAll(
      ".feature, .tool-card, .section-title, .section-sub"
    );
    targets.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(16px)";
      el.style.transition = "opacity .5s ease, transform .5s ease";
    });
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    targets.forEach((el) => io.observe(el));
  }
})();
