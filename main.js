const root = document.documentElement;
const themeToggle = document.getElementById("theme-toggle");
const printButton = document.getElementById("print-button");
const printedDate = document.getElementById("printed-date");
const navLinks = Array.from(document.querySelectorAll("[data-nav-link]"));
const sections = Array.from(document.querySelectorAll("[data-section]"));
const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));
const paperMotion = document.getElementById("paper-motion");
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);
const themeStorageKey = "gyx-archive-theme";

root.classList.add("js-ready");

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

  paperMotion.animate(
    [
      { offset: 0, transform: "translateY(-58px)" },
      { offset: 0.22, transform: "translateY(-34px)" },
      { offset: 0.4, transform: "translateY(-38px)" },
      { offset: 0.7, transform: "translateY(-12px)" },
      { offset: 1, transform: "translateY(0)" },
    ],
    {
      duration: 760,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      fill: "both",
    },
  );
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
      rootMargin: "-24% 0px -56% 0px",
      threshold: [0.18, 0.35, 0.52],
    },
  );

  sections.forEach((section) => observer.observe(section));
}

function revealItemsOnLoad() {
  if (!revealItems.length) {
    return;
  }

  requestAnimationFrame(() => {
    revealItems.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index * 36, 240)}ms`;
      item.classList.add("is-visible");
    });
  });
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
revealItemsOnLoad();
bindNavigation();

window.addEventListener("load", () => {
  playPaperFeedAnimation();
});

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
