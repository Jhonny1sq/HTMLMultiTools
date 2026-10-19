(() => {
  "use strict";

  const form = document.getElementById("grab-form");
  const btn = document.getElementById("grab-btn");
  const status = document.getElementById("status");
  const result = document.getElementById("result");
  const streams = document.getElementById("streams");
  const thumb = document.getElementById("thumb");
  const titleEl = document.getElementById("title");
  const meta = document.getElementById("meta");

  let mode = "mp4";

  document.querySelectorAll(".mode").forEach((b) => {
    b.addEventListener("click", () => {
      mode = b.dataset.mode;
      document.querySelectorAll(".mode").forEach((x) => {
        const on = x === b;
        x.classList.toggle("active", on);
        x.setAttribute("aria-selected", String(on));
      });
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const url = document.getElementById("url").value.trim();
    if (!url) return;

    btn.disabled = true;
    status.textContent = "resolving…";
    result.hidden = true;
    streams.innerHTML = "";

    try {
      const r = await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, format: mode }),
      });

      if (!r.ok) throw new Error("resolver error");
      const data = await r.json();

      titleEl.textContent = data.title || "untitled";
      meta.textContent = `${mode.toUpperCase()} · ${data.streams.length} stream(s)`;
      if (data.thumb) { thumb.src = data.thumb; thumb.alt = data.title || ""; }

      data.streams.forEach((s) => {
        const row = document.createElement("div");
        row.className = "stream";
        row.innerHTML = `<span>${s.quality} · ${s.ext}</span>`;
        const a = document.createElement("a");
        a.href = s.url;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = "grab";
        row.appendChild(a);
        streams.appendChild(row);
      });

      result.hidden = false;
      status.textContent = "done.";
    } catch {
      status.textContent = "could not resolve — check the link and try again.";
    } finally {
      btn.disabled = false;
    }
  });
})();
