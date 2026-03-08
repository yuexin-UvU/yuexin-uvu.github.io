const root = document.documentElement;
const themeToggle = document.getElementById("theme-toggle");
const printButton = document.getElementById("print-button");
const printedDate = document.getElementById("printed-date");
const navLinks = Array.from(document.querySelectorAll("[data-nav-link]"));
const sections = Array.from(document.querySelectorAll("[data-section]"));
const paperMotion = document.getElementById("paper-motion");
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);
const themeStorageKey = "gyx-theme";

function setTheme(theme) {
  root.dataset.theme = theme;
  localStorage.setItem(themeStorageKey, theme);

  if (!themeToggle) {
    return;
  }

  const nextLabel = theme === "dark" ? "切换浅色模式" : "切换深色模式";
  themeToggle.setAttribute("aria-label", nextLabel);
  themeToggle.setAttribute("title", nextLabel);
}

function resolveInitialTheme() {
  const savedTheme = localStorage.getItem(themeStorageKey);

  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function playPaperFeedAnimation() {
  if (!paperMotion || prefersReducedMotion.matches) {
    return;
  }

  paperMotion.getAnimations().forEach((animation) => animation.cancel());

  const keyframes = [
    { offset: 0, transform: "translateY(-56px)" },
    { offset: 0.24, transform: "translateY(-28px)" },
    { offset: 0.46, transform: "translateY(-32px)" },
    { offset: 0.72, transform: "translateY(-10px)" },
    { offset: 1, transform: "translateY(0)" },
  ];

  paperMotion.animate(keyframes, {
    duration: 680,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    fill: "both",
  });
}

function markActiveLink(id) {
  navLinks.forEach((link) => {
    const active = link.getAttribute("href") === `#${id}`;
    link.classList.toggle("active", active);

    if (active) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function observeSections() {
  if (!("IntersectionObserver" in window) || !sections.length) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const visibleEntries = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (visibleEntries.length) {
        markActiveLink(visibleEntries[0].target.id);
      }
    },
    {
      rootMargin: "-24% 0px -58% 0px",
      threshold: [0.2, 0.35, 0.55],
    },
  );

  sections.forEach((section) => observer.observe(section));
}

function bindNavigation() {
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      markActiveLink(link.getAttribute("href")?.slice(1) || "home");
      playPaperFeedAnimation();
    });
  });
}

function setPrintedDate() {
  if (!printedDate) {
    return;
  }

  const formatter = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  printedDate.textContent = formatter.format(new Date());
}

setTheme(resolveInitialTheme());
setPrintedDate();
observeSections();
bindNavigation();
playPaperFeedAnimation();

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  });
}

if (printButton) {
  printButton.addEventListener("click", () => {
    window.print();
  });
}
