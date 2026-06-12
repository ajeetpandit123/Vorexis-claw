/**
 * Vorexis-Claw Landing Page — Vanilla JS
 * Scroll reveal, terminal demo, typing animation, copy buttons
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
    { text: "⚡ VOREXIS CLAW", class: "text-violet-400 font-semibold", delay: 0 },
    { text: "", class: "", delay: 200 },
    { text: "Project        : coffee-claw", class: "terminal-dim", delay: 300 },
    { text: "Framework      : Bun", class: "terminal-dim", delay: 450 },
    { text: "Language       : TypeScript", class: "terminal-dim", delay: 600 },
    { text: "Git Branch     : main", class: "terminal-dim", delay: 750 },
    { text: "Git Status     : clean", class: "terminal-dim", delay: 900 },
    { text: "", class: "", delay: 1000 },
    { text: "────────────────────────────────────────", class: "terminal-dim", delay: 1100 },
    { text: "", class: "", delay: 1200 },
    { text: "What would you like to build, fix, understand, or plan?", class: "text-slate-200", delay: 1300 },
    { text: "", class: "", delay: 1400 },
    { text: "> Build JWT Authentication", class: "terminal-user", delay: 2200, type: "user" },
    { text: "", class: "", delay: 2800 },
    { text: "✓ Analyzing Project", class: "terminal-success", delay: 3200, step: true },
    { text: "✓ Creating Plan", class: "terminal-success", delay: 3800, step: true },
    { text: "✓ Updating Backend", class: "terminal-success", delay: 4400, step: true },
    { text: "✓ Running Verification", class: "terminal-success", delay: 5000, step: true },
    { text: "✓ Completed", class: "terminal-success font-semibold", delay: 5600, step: true },
  ];

  const INSTALL_COMMANDS = {
    npm: [
      "npm install -g vorexis-claw",
      "vorexis-claw login",
      "vorexis-claw",
    ],
    bun: [
      "bun install -g vorexis-claw",
      "vorexis-claw login",
      "vorexis-claw",
    ],
    pnpm: [
      "pnpm add -g vorexis-claw",
      "vorexis-claw login",
      "vorexis-claw",
    ],
  };

  /* ── Scroll reveal ── */
  function initScrollReveal() {
    const elements = document.querySelectorAll(".reveal");
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    elements.forEach((el) => observer.observe(el));
  }

  /* ── Nav scroll effect ── */
  function initNav() {
    const nav = document.getElementById("nav");
    if (!nav) return;

    let ticking = false;
    function updateNav() {
      nav.classList.toggle("nav-scrolled", window.scrollY > 20);
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          requestAnimationFrame(updateNav);
          ticking = true;
        }
      },
      { passive: true }
    );
    updateNav();

    const menuBtn = document.getElementById("mobile-menu-btn");
    const mobileMenu = document.getElementById("mobile-menu");
    if (menuBtn && mobileMenu) {
      menuBtn.addEventListener("click", () => {
        const open = mobileMenu.classList.toggle("hidden");
        menuBtn.setAttribute("aria-expanded", String(!open));
      });
      mobileMenu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          mobileMenu.classList.add("hidden");
          menuBtn.setAttribute("aria-expanded", "false");
        });
      });
    }
  }

  /* ── Hero typing animation ── */
  function initTypingAnimation() {
    const el = document.getElementById("typing-text");
    if (!el) return;

    let promptIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let rafId = null;

    function tick() {
      const current = TYPING_PROMPTS[promptIndex];
      let delay = isDeleting ? 35 : 55;

      if (!isDeleting) {
        el.textContent = "> " + current.substring(0, charIndex + 1);
        charIndex++;
        if (charIndex === current.length) {
          isDeleting = true;
          delay = 1800;
        }
      } else {
        el.textContent = "> " + current.substring(0, charIndex - 1);
        charIndex--;
        if (charIndex === 0) {
          isDeleting = false;
          promptIndex = (promptIndex + 1) % TYPING_PROMPTS.length;
          delay = 400;
        }
      }

      rafId = setTimeout(() => requestAnimationFrame(tick), delay);
    }

    tick();

    document.addEventListener("visibilitychange", () => {
      if (document.hidden && rafId) clearTimeout(rafId);
      else if (!document.hidden) tick();
    });
  }

  /* ── Terminal demo ── */
  function initTerminalDemo() {
    const container = document.getElementById("terminal-output");
    const section = document.getElementById("terminal-demo");
    if (!container || !section) return;

    let hasRun = false;
    let animationTimeouts = [];

    function clearAnimation() {
      animationTimeouts.forEach(clearTimeout);
      animationTimeouts = [];
    }

    function runTerminal() {
      if (hasRun) return;
      hasRun = true;
      container.innerHTML = "";

      TERMINAL_SCRIPT.forEach((line) => {
        const timeout = setTimeout(() => {
          if (line.text === "") {
            const br = document.createElement("div");
            br.className = "h-3";
            container.appendChild(br);
            return;
          }

          const div = document.createElement("div");
          div.className = `terminal-line ${line.class}`;
          div.textContent = line.text;
          container.appendChild(div);

          requestAnimationFrame(() => {
            div.classList.add("visible");
          });

          container.scrollTop = container.scrollHeight;
        }, line.delay);
        animationTimeouts.push(timeout);
      });
    }

    function resetTerminal() {
      clearAnimation();
      hasRun = false;
      container.innerHTML = "";
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) runTerminal();
          else if (entry.intersectionRatio === 0) resetTerminal();
        });
      },
      { threshold: 0.35 }
    );

    observer.observe(section);

    const replayBtn = document.getElementById("terminal-replay");
    if (replayBtn) {
      replayBtn.addEventListener("click", () => {
        resetTerminal();
        runTerminal();
      });
    }
  }

  /* ── Architecture hover ── */
  function initArchitecture() {
    const nodes = document.querySelectorAll("[data-arch-node]");
    const connectors = document.querySelectorAll("[data-arch-connector]");
    if (!nodes.length) return;

    nodes.forEach((node, index) => {
      node.addEventListener("mouseenter", () => {
        nodes.forEach((n) => n.classList.remove("active"));
        connectors.forEach((c) => c.classList.remove("active"));
        node.classList.add("active");
        if (connectors[index]) connectors[index].classList.add("active");
      });
      node.addEventListener("mouseleave", () => {
        node.classList.remove("active");
        if (connectors[index]) connectors[index].classList.remove("active");
      });
    });
  }

  /* ── Install tabs & copy ── */
  function initInstallSection() {
    const tabs = document.querySelectorAll("[data-install-tab]");
    const codeBlock = document.getElementById("install-code");
    if (!tabs.length || !codeBlock) return;

    function renderCommands(pkg) {
      const cmds = INSTALL_COMMANDS[pkg] || INSTALL_COMMANDS.npm;
      codeBlock.innerHTML = cmds
        .map(
          (cmd, i) =>
            `<div class="flex items-center justify-between group${i < cmds.length - 1 ? " mb-3 pb-3 border-b border-slate-700/50" : ""}">
              <code class="text-sm text-slate-300 font-mono">${escapeHtml(cmd)}</code>
              <button type="button" class="copy-btn opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity px-2 py-1 text-xs text-violet-400 hover:text-violet-300 rounded border border-slate-700 hover:border-violet-500/40" data-copy="${escapeHtml(cmd)}" aria-label="Copy command">Copy</button>
            </div>`
        )
        .join("");

      codeBlock.querySelectorAll(".copy-btn").forEach((btn) => {
        btn.addEventListener("click", () => copyText(btn.dataset.copy));
      });
    }

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        renderCommands(tab.dataset.installTab);
      });
    });

    renderCommands("npm");
  }

  /* ── Copy helpers ── */
  function initCopyButtons() {
    document.querySelectorAll("[data-copy]").forEach((btn) => {
      if (btn.classList.contains("copy-btn")) return;
      btn.addEventListener("click", () => copyText(btn.dataset.copy));
    });

    const heroCopy = document.getElementById("hero-install-copy");
    if (heroCopy) {
      heroCopy.addEventListener("click", () =>
        copyText("npm install -g vorexis-claw")
      );
    }
  }

  function copyText(text) {
    navigator.clipboard.writeText(text).then(showCopyToast).catch(() => {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      showCopyToast();
    });
  }

  function showCopyToast() {
    const toast = document.getElementById("copy-toast");
    if (!toast) return;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ── Timeline connectors ── */
  function initTimeline() {
    const connectors = document.querySelectorAll(".timeline-connector");
    if (!connectors.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animated");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    connectors.forEach((c) => observer.observe(c));
  }

  /* ── Smooth anchor scroll offset for fixed nav ── */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", (e) => {
        const id = anchor.getAttribute("href");
        if (!id || id === "#") return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const navHeight = document.getElementById("nav")?.offsetHeight || 64;
        const top =
          target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
        window.scrollTo({ top, behavior: "smooth" });
      });
    });
  }

  /* ── Set GitHub links ── */
  function initGitHubLinks() {
    document.querySelectorAll("[data-github]").forEach((el) => {
      el.setAttribute("href", GITHUB_URL);
    });
  }

  /* ── Init ── */
  function init() {
    initScrollReveal();
    initNav();
    initTypingAnimation();
    initTerminalDemo();
    initArchitecture();
    initInstallSection();
    initCopyButtons();
    initTimeline();
    initSmoothScroll();
    initGitHubLinks();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
