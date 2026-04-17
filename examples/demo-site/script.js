/* Peizhong Gao — personal site
 * Progressive enhancements:
 *   - theme toggle (light/dark)
 *   - language toggle (EN / 中)
 *   - nav spy, reveal on scroll
 *   - live Google Scholar stats from data/scholar.json (with fallback) */

(() => {
  const root = document.documentElement;

  /* =========== Theme toggle =========== */
  const THEME_KEY = "pg-theme";
  const applyTheme = (t) => {
    root.setAttribute("data-theme", t);
    try { localStorage.setItem(THEME_KEY, t); } catch (_) {}
  };
  const storedTheme = (() => { try { return localStorage.getItem(THEME_KEY); } catch (_) { return null; } })();
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  applyTheme(storedTheme || (prefersDark ? "dark" : "light"));

  document.getElementById("themeToggle")?.addEventListener("click", () => {
    applyTheme(root.getAttribute("data-theme") === "dark" ? "light" : "dark");
  });

  /* =========== Language toggle =========== */
  const LANG_KEY = "pg-lang";
  const applyLang = (lang) => {
    root.setAttribute("data-lang", lang);
    root.setAttribute("lang", lang === "zh" ? "zh-CN" : "en");
    const otherLabel = lang === "zh" ? "EN" : "中";
    const btnLabel = document.querySelector("#langToggle .lt-label");
    if (btnLabel) btnLabel.textContent = otherLabel;

    document.querySelectorAll("[data-en][data-zh]").forEach((el) => {
      const value = el.dataset[lang];
      if (value == null) return;
      if (el.dataset.enHtml === "true" || value.includes("<")) {
        el.innerHTML = value;
      } else {
        el.textContent = value;
      }
    });

    try { localStorage.setItem(LANG_KEY, lang); } catch (_) {}
  };

  const storedLang = (() => { try { return localStorage.getItem(LANG_KEY); } catch (_) { return null; } })();
  applyLang(storedLang || "en");

  document.getElementById("langToggle")?.addEventListener("click", () => {
    applyLang(root.getAttribute("data-lang") === "en" ? "zh" : "en");
  });

  /* =========== Footer year =========== */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* =========== Header scroll state =========== */
  const header = document.getElementById("site-header");
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* =========== Nav spy =========== */
  const navLinks = Array.from(document.querySelectorAll(".nav-primary a"));
  const map = new Map();
  navLinks.forEach((a) => {
    const id = a.getAttribute("href")?.replace("#", "");
    if (!id) return;
    const target = document.getElementById(id);
    if (target) map.set(target, a);
  });
  if ("IntersectionObserver" in window && map.size) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const link = map.get(entry.target);
          if (!link) return;
          if (entry.isIntersecting && entry.intersectionRatio > 0.15) {
            navLinks.forEach((a) => a.classList.remove("is-active"));
            link.classList.add("is-active");
          }
        });
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0.15, 0.4] }
    );
    map.forEach((_, section) => spy.observe(section));
  }

  /* =========== Scholar impact widget =========== */
  const scholarJsonUrl = "data/scholar.json?v=" + Date.now();
  const statusEl  = document.getElementById("impactStatus");
  const barsEl    = document.getElementById("impactBars");
  const updatedEl = document.getElementById("impactUpdated");

  const setStatus = (text, cls) => {
    if (!statusEl) return;
    statusEl.classList.remove("is-live", "is-stale", "is-error");
    if (cls) statusEl.classList.add(cls);
    statusEl.textContent = text;
  };

  const fmtAgo = (iso) => {
    if (!iso) return "just now";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "just now";
    const sec = Math.max(1, Math.round((Date.now() - d.getTime()) / 1000));
    if (sec < 60)   return `${sec}s ago`;
    const min = Math.round(sec / 60);
    if (min < 60)   return `${min}m ago`;
    const hr = Math.round(min / 60);
    if (hr < 24)    return `${hr}h ago`;
    const dy = Math.round(hr / 24);
    if (dy < 30)    return `${dy}d ago`;
    return d.toISOString().slice(0, 10);
  };

  const animateNumber = (el, target) => {
    if (!el || !Number.isFinite(target)) return;
    const from = parseInt((el.textContent || "0").replace(/[^\d-]/g, ""), 10) || 0;
    if (from === target) { el.textContent = target.toLocaleString(); return; }
    const duration = 900;
    const start = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (target - from) * eased).toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const renderChart = (perYear) => {
    if (!barsEl || !perYear) return;
    const entries = Object.entries(perYear)
      .map(([y, c]) => [Number(y), Number(c)])
      .filter(([y, c]) => Number.isFinite(y) && Number.isFinite(c))
      .sort((a, b) => a[0] - b[0]);
    if (!entries.length) return;

    const thisYear = new Date().getFullYear();
    const recent = entries.filter(([y]) => y >= thisYear - 4);
    const max = Math.max(...recent.map(([, c]) => c), 1);

    barsEl.innerHTML = "";
    recent.forEach(([year, count]) => {
      const pct = (count / max) * 100;
      const row = document.createElement("div");
      row.className = "impact-bar-row" + (year === thisYear ? " is-current" : "");
      row.dataset.year = String(year);
      row.dataset.count = String(count);
      row.innerHTML = `
        <span class="impact-bar-year">${year}</span>
        <div class="impact-bar-track"><span class="impact-bar-fill" style="width:0%"></span></div>
        <span class="impact-bar-count">${count.toLocaleString()}</span>
      `;
      barsEl.appendChild(row);
      requestAnimationFrame(() => {
        const fill = row.querySelector(".impact-bar-fill");
        if (fill) fill.style.width = pct.toFixed(1) + "%";
      });
    });
  };

  const applyScholar = (data, { live = true } = {}) => {
    if (!data) return;
    animateNumber(document.getElementById("sideTotal"), Number(data.total_citations));
    animateNumber(document.getElementById("sideH"),     Number(data.h_index));
    animateNumber(document.getElementById("sidePubs"),  Number(data.publications_count));
    if (data.per_year) renderChart(data.per_year);
    if (updatedEl && data.last_updated) {
      const lang = root.getAttribute("data-lang") || "en";
      const phrase = lang === "zh"
        ? `上次同步 ${fmtAgo(data.last_updated)}，数据来自 Google Scholar。`
        : `Synced ${fmtAgo(data.last_updated)} from Google Scholar.`;
      updatedEl.textContent = phrase;
      updatedEl.dataset.en = `Synced ${fmtAgo(data.last_updated)} from Google Scholar.`;
      updatedEl.dataset.zh = `上次同步 ${fmtAgo(data.last_updated)}，数据来自 Google Scholar。`;
    }
    setStatus(live ? "live" : "cached", live ? "is-live" : "is-stale");
  };

  fetch(scholarJsonUrl, { cache: "no-store" })
    .then((r) => { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
    .then((data) => applyScholar(data, { live: true }))
    .catch(() => {
      setStatus("offline", "is-error");
    });

  /* =========== Reveal on scroll =========== */
  const revealEls = document.querySelectorAll(
    ".profile-incoming, .profile-stats, .impact, .pub, .exp li, .honors li, .edu li, .news li, .about-body p, .skills-line"
  );
  revealEls.forEach((el) => el.classList.add("reveal"));
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.06, rootMargin: "0px 0px -30px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }
})();
