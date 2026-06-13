/**
 * Vorexis-Claw Landing Page
 */
(function () {
  "use strict";

  const GITHUB_URL = "https://github.com/ajeetpandit123/Vorexis-claw";
  const TYPING_PROMPTS = [
    "Build authentication system",
    "Explain my architecture",
    "Fix websocket bug",
    "Create SaaS roadmap",
  ];

  const TERMINAL_SCRIPT = [
    { text: "$ vorexis-claw wakeup", cls: "terminal-cmd", delay: 400 },
    { text: "", delay: 700 },
    { text: "╭──────────────────────────────────────────────╮", cls: "terminal-border", delay: 900 },
    { text: "│  ⚡ VOREXIS CLAW                              │", cls: "terminal-title", delay: 1050 },
    { text: "│  Autonomous Software Engineer AI             │", cls: "terminal-sub", delay: 1200 },
    { text: "╰──────────────────────────────────────────────╯", cls: "terminal-border", delay: 1350 },
    { text: "", delay: 1500 },
    { text: "Project        : coffee-claw", cls: "terminal-dim", delay: 1650 },
    { text: "Framework      : Bun", cls: "terminal-dim", delay: 1780 },
    { text: "Language       : TypeScript", cls: "terminal-dim", delay: 1910 },
    { text: "Package Manager: bun", cls: "terminal-dim", delay: 2040 },
    { text: "Git Branch     : main", cls: "terminal-dim", delay: 2170 },
    { text: "Git Status     : clean", cls: "terminal-dim", delay: 2300 },
    { text: "", delay: 2450 },
    { text: "────────────────────────────────────────────────", cls: "terminal-border", delay: 2550 },
    { text: "", delay: 2650 },
    { text: "🎤 Voice Available", cls: "terminal-voice", delay: 2750 },
    { text: "Type your prompt or press V to record", cls: "terminal-dim", delay: 2880 },
    { text: "", delay: 3000 },
    { text: "What would you like to build, fix, understand, or plan?", cls: "terminal-prompt", delay: 3100 },
    { text: "", delay: 3200 },
    { text: "> Build JWT Authentication", cls: "terminal-user type-char", delay: 4200 },
    { text: "", delay: 5000 },
    { text: "⟳ Routing to Agent engine...", cls: "terminal-dim", delay: 5300 },
    { text: "✓ Analyzing Project", cls: "terminal-success", delay: 5800 },
    { text: "✓ Creating Plan", cls: "terminal-success", delay: 6300 },
    { text: "✓ Updating Backend", cls: "terminal-success", delay: 6800 },
    { text: "✓ Running Verification", cls: "terminal-success", delay: 7300 },
    { text: "✓ Completed — JWT auth with refresh tokens added", cls: "terminal-success terminal-bold", delay: 7800 },
  ];

  const INSTALL_COMMANDS = {
    npm: ["npm install -g vorexis-claw", "vorexis-claw login", "vorexis-claw wakeup"],
    bun: ["bun install -g vorexis-claw", "vorexis-claw login", "vorexis-claw wakeup"],
    pnpm: ["pnpm add -g vorexis-claw", "vorexis-claw login", "vorexis-claw wakeup"],
  };

  /* ── Copy (robust fallback) ── */
  async function copyText(text) {
    if (!text) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error("fallback");
      }
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:0;left:0;width:2em;height:2em;opacity:0;";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      ta.setSelectionRange(0, text.length);
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    showCopyToast();
    document.querySelectorAll(".copy-btn.copied").forEach((b) => b.classList.remove("copied"));
    const active = document.activeElement;
    if (active && active.classList.contains("copy-btn")) {
      active.classList.add("copied");
      active.textContent = "Copied!";
      setTimeout(() => { active.textContent = "Copy"; active.classList.remove("copied"); }, 1500);
    }
  }

  function showCopyToast() {
    const toast = document.getElementById("copy-toast");
    if (!toast) return;
    toast.classList.add("show");
    clearTimeout(showCopyToast._t);
    showCopyToast._t = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  function initCopyDelegation() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-copy]");
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();
      copyText(btn.getAttribute("data-copy"));
    });
    const heroCopy = document.getElementById("hero-install-copy");
    if (heroCopy) {
      heroCopy.setAttribute("data-copy", "npm install -g vorexis-claw");
    }
  }

  /* ── Scroll reveal ── */
  function initScrollReveal() {
    const els = document.querySelectorAll(".reveal, .reveal-scale, .reveal-left, .reveal-right");
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("revealed");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px 0px" }
    );
    els.forEach((el) => obs.observe(el));
  }

  /* ── Stagger feature cards ── */
  function initFeatureStagger() {
    const cards = document.querySelectorAll(".feature-card");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            cards.forEach((c, i) => {
              setTimeout(() => c.classList.add("feature-visible"), i * 80);
            });
            obs.disconnect();
          }
        });
      },
      { threshold: 0.15 }
    );
    const grid = document.getElementById("features-grid");
    if (grid) obs.observe(grid);
  }

  /* ── Nav ── */
  function initNav() {
    const nav = document.getElementById("nav");
    if (!nav) return;
    const onScroll = () => nav.classList.toggle("nav-scrolled", window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const btn = document.getElementById("mobile-menu-btn");
    const menu = document.getElementById("mobile-menu");
    if (btn && menu) {
      btn.addEventListener("click", () => {
        const hidden = menu.classList.toggle("hidden");
        btn.setAttribute("aria-expanded", String(!hidden));
      });
      menu.querySelectorAll("a").forEach((a) =>
        a.addEventListener("click", () => {
          menu.classList.add("hidden");
          btn.setAttribute("aria-expanded", "false");
        })
      );
    }
  }

  /* ── Hero typing ── */
  function initTypingAnimation() {
    const el = document.getElementById("typing-text");
    if (!el) return;
    let pi = 0, ci = 0, del = false, timer = null;

    function tick() {
      const cur = TYPING_PROMPTS[pi];
      let wait = del ? 30 : 50;
      if (!del) {
        el.textContent = "> " + cur.slice(0, ++ci);
        if (ci >= cur.length) { del = true; wait = 2000; }
      } else {
        el.textContent = "> " + cur.slice(0, --ci);
        if (ci <= 0) { del = false; pi = (pi + 1) % TYPING_PROMPTS.length; wait = 350; }
      }
      timer = setTimeout(tick, wait);
    }
    tick();
  }

  /* ── Terminal demo ── */
  function initTerminalDemo() {
    const container = document.getElementById("terminal-output");
    if (!container) return;

    let timeouts = [];
    let running = false;

    function clearAll() {
      timeouts.forEach(clearTimeout);
      timeouts = [];
      running = false;
    }

    function appendLine(line) {
      if (line.text === "") {
        container.appendChild(document.createElement("br"));
        return;
      }
      const div = document.createElement("div");
      div.className = "terminal-line " + (line.cls || "");
      if (line.cls && line.cls.includes("type-char")) {
        div.textContent = "";
        container.appendChild(div);
        div.classList.add("visible");
        let i = 0;
        const chars = line.text;
        const typeInterval = setInterval(() => {
          div.textContent = chars.slice(0, ++i);
          container.scrollTop = container.scrollHeight;
          if (i >= chars.length) clearInterval(typeInterval);
        }, 45);
      } else {
        div.textContent = line.text;
        container.appendChild(div);
        requestAnimationFrame(() => div.classList.add("visible"));
      }
      container.scrollTop = container.scrollHeight;
    }

    function run() {
      if (running) return;
      running = true;
      container.innerHTML = "";

      // Show cursor immediately
      const cursor = document.createElement("div");
      cursor.id = "terminal-cursor-line";
      cursor.className = "terminal-line terminal-cmd visible";
      cursor.innerHTML = '<span class="terminal-cursor-blink">▋</span>';
      container.appendChild(cursor);

      TERMINAL_SCRIPT.forEach((line) => {
        const t = setTimeout(() => {
          const cur = document.getElementById("terminal-cursor-line");
          if (cur && line.text.startsWith("$")) cur.remove();
          appendLine(line);
        }, line.delay);
        timeouts.push(t);
      });
    }

    function reset() {
      clearAll();
      container.innerHTML = '<div class="terminal-line terminal-dim visible">Loading session...</div>';
    }

    // Auto-run on load + when scrolled into view
    reset();
    setTimeout(run, 600);

    const section = document.getElementById("terminal-demo");
    if (section) {
      const obs = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !running) {
            reset();
            setTimeout(run, 300);
          }
        },
        { threshold: 0.2 }
      );
      obs.observe(section);
    }

    document.getElementById("terminal-replay")?.addEventListener("click", () => {
      clearAll();
      container.innerHTML = "";
      setTimeout(run, 200);
    });
  }

  /* ── Architecture auto-flow ── */
  function initArchitectureFlow() {
    const nodes = document.querySelectorAll("[data-arch-node]");
    const paths = document.querySelectorAll("[data-arch-path]");
    if (!nodes.length) return;

    let idx = 0;
    let interval = null;

    function activate(i) {
      nodes.forEach((n, j) => n.classList.toggle("active", j === i));
      paths.forEach((p, j) => p.classList.toggle("active", j < i));
    }

    function startAuto() {
      interval = setInterval(() => {
        activate(idx);
        idx = (idx + 1) % nodes.length;
      }, 1800);
    }

    nodes.forEach((node, i) => {
      node.addEventListener("mouseenter", () => {
        clearInterval(interval);
        activate(i);
      });
      node.addEventListener("mouseleave", () => {
        clearInterval(interval);
        idx = i;
        startAuto();
      });
    });

    const section = document.getElementById("architecture");
    if (section) {
      const obs = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            activate(0);
            startAuto();
            obs.disconnect();
          }
        },
        { threshold: 0.3 }
      );
      obs.observe(section);
    }
  }

  /* ── Install tabs ── */
  function initInstallSection() {
    const tabs = document.querySelectorAll("[data-install-tab]");
    const block = document.getElementById("install-code");
    if (!tabs.length || !block) return;

    function render(pkg) {
      const cmds = INSTALL_COMMANDS[pkg] || INSTALL_COMMANDS.npm;
      block.innerHTML = cmds
        .map(
          (cmd, i) =>
            `<div class="install-row${i < cmds.length - 1 ? " border-b border-slate-700/40" : ""}">
              <code class="install-cmd">${esc(cmd)}</code>
              <button type="button" class="copy-btn" data-copy="${esc(cmd)}" aria-label="Copy">Copy</button>
            </div>`
        )
        .join("");
    }

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        render(tab.dataset.installTab);
      });
    });
    render("npm");
  }

  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  }

  /* ── Docs sidebar ── */
  function initDocsNav() {
    const links = document.querySelectorAll("[data-doc-link]");
    const sections = document.querySelectorAll("[data-doc-section]");
    if (!links.length) return;

    links.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const id = link.dataset.docLink;
        links.forEach((l) => l.classList.remove("active"));
        link.classList.add("active");
        sections.forEach((s) => s.classList.toggle("hidden", s.dataset.docSection !== id));
        document.getElementById("docs")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  /* ── Timeline ── */
  function initTimeline() {
    document.querySelectorAll(".timeline-connector").forEach((c) => {
      const obs = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            c.classList.add("animated");
            obs.disconnect();
          }
        },
        { threshold: 0.5 }
      );
      obs.observe(c);
    });
  }

  /* ── Smooth scroll ── */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (!id || id === "#") return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const navH = document.getElementById("nav")?.offsetHeight || 64;
        window.scrollTo({
          top: target.getBoundingClientRect().top + window.scrollY - navH - 12,
          behavior: "smooth",
        });
      });
    });
  }

  function initGitHubLinks() {
    document.querySelectorAll("[data-github]").forEach((el) => el.setAttribute("href", GITHUB_URL));
    document.querySelectorAll("[data-docs-link]").forEach((el) => el.setAttribute("href", "#docs"));
  }

  /* ── Composer mic demo (landing) ── */
  function initComposerDemo() {
    const micBtn = document.getElementById("composer-mic-btn");
    const status = document.getElementById("composer-status");
    const typed = document.getElementById("composer-typed");
    if (!micBtn || !status) return;

    let recording = false;
    let timer = null;

    micBtn.addEventListener("click", () => {
      if (recording) {
        recording = false;
        micBtn.classList.remove("recording");
        status.className = "composer-status success";
        status.textContent = "✓ Transcribed: Build JWT authentication with refresh tokens";
        if (typed) {
          typed.textContent = "Build JWT authentication with refresh tokens";
          typed.classList.remove("hidden");
          document.getElementById("composer-placeholder")?.classList.add("hidden");
        }
        clearTimeout(timer);
        return;
      }

      recording = true;
      micBtn.classList.add("recording");
      status.className = "composer-status recording";
      status.textContent = "🎙 Recording… click mic again to stop & transcribe";

      timer = setTimeout(() => {
        if (recording) {
          recording = false;
          micBtn.classList.remove("recording");
          status.className = "composer-status success";
          status.textContent = "✓ Transcribed: Explain my project architecture";
          if (typed) {
            typed.textContent = "Explain my project architecture";
            typed.classList.remove("hidden");
            document.getElementById("composer-placeholder")?.classList.add("hidden");
          }
        }
      }, 4000);
    });
  }

  /* ── Parallax orbs on mouse ── */
  function initHeroParallax() {
    const hero = document.getElementById("hero");
    if (!hero || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    hero.addEventListener("mousemove", (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      hero.querySelectorAll(".hero-orb").forEach((orb, i) => {
        const f = (i + 1) * 0.5;
        orb.style.transform = `translate(${x * f}px, ${y * f}px)`;
      });
    });
  }

  /* ── Counter animation ── */
  function initCounters() {
    document.querySelectorAll("[data-count]").forEach((el) => {
      const target = parseInt(el.dataset.count, 10);
      const obs = new IntersectionObserver(
        (entries) => {
          if (!entries[0].isIntersecting) return;
          let cur = 0;
          const step = Math.ceil(target / 40);
          const t = setInterval(() => {
            cur = Math.min(cur + step, target);
            el.textContent = cur + (el.dataset.suffix || "");
            if (cur >= target) clearInterval(t);
          }, 30);
          obs.disconnect();
        },
        { threshold: 0.5 }
      );
      obs.observe(el);
    });
  }

  function init() {
    initCopyDelegation();
    initScrollReveal();
    initFeatureStagger();
    initNav();
    initTypingAnimation();
    initTerminalDemo();
    initArchitectureFlow();
    initInstallSection();
    initDocsNav();
    initTimeline();
    initSmoothScroll();
    initGitHubLinks();
    initHeroParallax();
    initCounters();
    initComposerDemo();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
