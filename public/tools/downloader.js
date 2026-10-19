// PRISM — media grabber wiring
(() => {
  "use strict";

  const form = document.getElementById("grab-form");
  const btn = document.getElementById("grab-btn");
  const statusEl = document.getElementById("status");
  const result = document.getElementById("result");
  const streamsEl = document.getElementById("streams");
  const thumb = document.getElementById("thumb");
  const titleEl = document.getElementById("title");
  const meta = document.getElementById("meta");
  const moreWrap = document.getElementById("more-wrap");
  const moreBtn = document.getElementById("more-btn");

  let mode = "mp4";
  let allStreams = [];
  let expanded = false;
  const VISIBLE = 5;

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

  // --- stream cleaning -------------------------------------------------
  function heightOf(label) {
    const m = String(label || "").match(/(\d{3,4})p/);
    return m ? Number(m[1]) : 0;
  }

  function kbpsOf(item) {
    const m = String(item.bitrate || item.qualityLabel || "").match(/(\d{2,4})\s*k/i);
    if (m) return Number(m[1]);
    const n = Number(item.bitrate);
    return Number.isFinite(n) ? Math.round(n / 1000) : 0;
  }

  function clean(list, kind) {
    const seen = new Set();
    const out = [];

    for (const s of list) {
      if (!s || !s.url) continue;
      const h = kind === "video" ? heightOf(s.qualityLabel || s.quality) : 0;
      const b = kind === "audio" ? kbpsOf(s) : 0;
      const label = kind === "video"
        ? (h ? `${h}p` : String(s.qualityLabel || "auto"))
        : (b ? `${b} kbps` : String(s.qualityLabel || "audio"));

      // dedupe on the human-facing label, keep the first (usually best mux)
      const key = kind === "video" ? label : `${label}`;
      if (seen.has(key)) continue;
      seen.add(key);

      out.push({
        label,
        rank: kind === "video" ? h : b,
        ext: kind === "video" ? "mp4" : "mp3",
        size: s.size || null,
        url: s.url,
      });
    }

    out.sort((a, b) => b.rank - a.rank);
    return out;
  }

  function fmtSize(s) {
    const n = Number(s);
    if (!Number.isFinite(n) || n <= 0) return "";
    if (n > 1e9) return `${(n / 1e9).toFixed(1)} GB`;
    if (n > 1e6) return `${Math.round(n / 1e6)} MB`;
    return `${Math.round(n / 1e3)} KB`;
  }

  // --- rendering -------------------------------------------------------
  function row(s, i) {
    const wrap = document.createElement("div");
    wrap.className = "stream" + (i === 0 ? " best" : "");

    const left = document.createElement("div");
    left.className = "stream-info";

    const q = document.createElement("strong");
    q.textContent = s.label;

    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = s.ext;

    left.append(q, tag);

    if (i === 0) {
      const badge = document.createElement("span");
      badge.className = "pick";
      badge.textContent = "best";
      left.appendChild(badge);
    }

    const size = fmtSize(s.size);
    if (size) {
      const sz = document.createElement("span");
      sz.className = "size";
      sz.textContent = size;
      left.appendChild(sz);
    }

    const a = document.createElement("a");
    a.href = s.url;
    a.target = "_blank";
    a.rel = "noopener";
    a.className = "grab-link";
    a.textContent = "grab";

    wrap.append(left, a);
    return wrap;
  }

  function paint() {
    streamsEl.innerHTML = "";
    const list = expanded ? allStreams : allStreams.slice(0, VISIBLE);
    list.forEach((s, i) => streamsEl.appendChild(row(s, i)));

    const hidden = allStreams.length - VISIBLE;
    if (hidden > 0) {
      moreWrap.hidden = false;
      moreBtn.textContent = expanded
        ? "show less"
        : `show ${hidden} more option${hidden === 1 ? "" : "s"}`;
    } else {
      moreWrap.hidden = true;
    }
  }

  moreBtn?.addEventListener("click", () => {
    expanded = !expanded;
    paint();
  });

  // --- submit ----------------------------------------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const url = document.getElementById("url").value.trim();
    if (!url) return;

    btn.disabled = true;
    statusEl.textContent = "reading the link…";
    statusEl.className = "status loading";
    result.hidden = true;
    streamsEl.innerHTML = "";
    moreWrap.hidden = true;
    expanded = false;

    try {
      const r = await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, format: mode }),
      });

      const data = await r.json();

      if (!r.ok) {
        statusEl.textContent = `resolver ${r.status} — ${data.detail || data.error || "try again"}`;
        statusEl.className = "status bad";
        return;
      }

      allStreams = clean(data.streams || [], mode === "mp3" ? "audio" : "video");

      if (!allStreams.length) {
        statusEl.textContent = "no playable streams for that link.";
        statusEl.className = "status bad";
        return;
      }

      titleEl.textContent = data.title || "untitled";
      meta.textContent = `${mode.toUpperCase()} · ${allStreams.length} option${allStreams.length === 1 ? "" : "s"}`;
      if (data.thumb) {
        thumb.src = data.thumb;
        thumb.alt = data.title || "";
        thumb.hidden = false;
      } else {
        thumb.hidden = true;
      }

      paint();
      result.hidden = false;
      statusEl.textContent = "";
      statusEl.className = "status";
    } catch {
      statusEl.textContent = "network hiccup — run it again.";
      statusEl.className = "status bad";
    } finally {
      btn.disabled = false;
    }
  });
})();
