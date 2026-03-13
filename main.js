const root = document.documentElement;
const themeToggle = document.getElementById("theme-toggle");
const languageToggle = document.getElementById("language-toggle");
const themeDial = document.getElementById("theme-dial");
const languageDial = document.getElementById("language-dial");
const printButton = document.getElementById("print-button");
const themeToggleLabel = document.getElementById("theme-toggle-label");
const languageToggleLabel = document.getElementById("language-toggle-label");
const printLabel = document.getElementById("print-label");
const printedDate = document.getElementById("printed-date");
const pageDescription = document.getElementById("page-description");
const navLinks = Array.from(document.querySelectorAll("[data-nav-link]"));
const sections = Array.from(document.querySelectorAll("[data-section]"));
const paperMotion = document.getElementById("paper-motion");
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);
const systemThemeMedia = window.matchMedia("(prefers-color-scheme: dark)");
const themeModeStorageKey = "gyx-theme-mode-v2";
const languageStorageKey = "gyx-language";
const themeModes = ["system", "light", "dark"];
const languages = ["zh", "en"];
const themeDialRotation = {
  system: -45,
  light: 0,
  dark: 45,
};
const languageDialRotation = {
  zh: -45,
  en: 45,
};

const translations = {
  en: {
    title: "Yuexin Guo | Museum Audience Research & Curatorial Practice",
    description:
      "I focus on museum audience research, museum rhetoric, exhibition evaluation, and curatorial practice.",
    texts: {
      "brand-tagline": "Museum Audience Research / Curatorial Notes",
      "nav-home-label": "Home",
      "nav-research-label": "Research",
      "nav-works-label": "Works",
      "nav-field-label": "Field",
      "nav-contact-label": "Contact",
      "hero-chip": "Archive Card GYX-2026",
      "hero-banner-text": "Museum Audience Research / Curatorial Practice",
      "hero-kicker": "Museum Audience Research / Museum Rhetoric",
      "hero-name": "Yuexin Guo",
      "hero-lead":
        "I am an M.A. candidate in Museum Studies at Nanjing University. I focus on museum audience research, museum rhetoric, and narrative exhibitions. My primary methods include UGC text analysis, thematic analysis, interviews, and exhibition evaluation, and I continue to work in curation, exhibition writing, and cultural communication.",
      "tag-1": "Audience Research",
      "tag-2": "Museum Rhetoric",
      "tag-3": "Exhibition Evaluation",
      "tag-4": "Curatorial Writing",
      "contact-base": "Base / Nanjing · Suzhou",
      "stat-label-1": "Selected papers & reviews",
      "stat-label-2": "UGC text samples",
      "stat-label-3": "In-depth interviews",
      "stat-label-4": "Academic ranking",
      "profile-title": "Profile",
      "profile-stamp": "Archive Seal",
      "quote-text":
        '"Interest reactivates the meaning of exhibits through intertextual comparison and affective confirmation."',
      "quote-source":
        'From "Reverse Activation and Identity Practice: Museum Visiting Mechanisms in Interest-Based Communities"',
      "research-section-label": "Research Focus",
      "research-section-title": "Research Directions",
      "direction-chip-1": "Track 01",
      "direction-title-1": "Museum Audience Research",
      "direction-body-1":
        "This line of work examines how audiences construct meaning across digital media, interest communities, and exhibition spaces. Topics include uncivil museum behavior, interest-driven visits, cultural product consumption, and audience evaluation for cross-cultural exhibitions.",
      "direction-chip-2": "Track 02",
      "direction-title-2": "Museum Rhetoric and Narrative Exhibitions",
      "direction-body-2":
        "This research explores how exhibition texts, spatial narratives, and rhetorical strategies shape public cognition and identity, while extending theory into curatorial practice, label writing, and exhibition worldbuilding.",
      "works-section-label": "Selected Works",
      "works-section-title": "Selected Publications",
      "work-card-chip-1": "Sole Author",
      "work-card-title-1":
        "Audience Feedback on Uncivil Museum Visiting Behavior",
      "work-card-meta-1":
        "Chinese Museum · CSSCI Extended Edition · 2025",
      "work-card-body-1":
        "Based on social-media UGC and text analysis, this article examines how audiences identify, name, and respond to problems of order in museum visits, offering empirical insight for audience governance.",
      "work-card-chip-2": "Article",
      "work-card-title-2":
        "Reverse Activation and Identity Practice: Museum Visiting Mechanisms in Interest-Based Communities",
      "work-card-meta-2": "Published · Museum audience research",
      "work-card-body-2":
        "Drawing on 1,046 posts from Xiaohongshu and Weibo, this study proposes a path in which interest communities reactivate exhibit meaning, highlighting identity practice and decentralized interpretation networks.",
      "work-card-chip-3": "Review",
      "work-card-title-3":
        "From Narrative to Rhetoric: A Review of Museum Rhetoric and Its Methodological Significance",
      "work-card-meta-3":
        "Science Education and Museums · Published",
      "work-card-body-3":
        "This review discusses how research on narrative exhibitions can move toward rhetorical analysis, linking exhibition discourse, spatial structure, and public identity formation.",
      "work-card-chip-4": "Collaborative Study",
      "work-card-title-4":
        "Consumer Motivation for the Phoenix-Crown Fridge Magnet: A Semantic Topic Analysis",
      "work-card-meta-4": "Included in Museum Management",
      "work-card-body-4":
        "This collaborative study investigates cultural-product consumption through user-generated content and semantic topic modeling, with primary responsibility for data processing and semantic analysis.",
      "callout-body-1":
        "Invited to present research at the Jiangsu and China main-venue youth forums of International Museum Day (May 18).",
      "callout-body-2":
        "Selected for the 2025 Jiangsu Graduate Practice and Innovation Program, continuing work on the rhetoric of narrative exhibitions.",
      "portfolio-kicker": "Portfolio",
      "portfolio-title": "Curatorial & Creative Projects",
      "portfolio-intro":
        "Three clickable portfolio entries are collected here. Each card opens a dedicated project page in a new tab, with continued access to the original Word file.",
      "portfolio-chip-1": "Project 01",
      "portfolio-card-title-1":
        '"Steel and Glory: Interpretation Script for the European Knight Armor and Culture Exhibition"',
      "portfolio-card-meta-1": "Interpretation script · Guided exhibition narrative",
      "portfolio-card-body-1":
        "Focused on the unit 'The Twilight of Knights,' this project organizes visitor-facing transitions and object interpretation around armor, polearms, firearms, and the decline of knighthood.",
      "portfolio-card-cta-1": "Open project ↗",
      "portfolio-chip-2": "Project 02",
      "portfolio-card-title-2":
        '"Mesoamerican Maya Civilization Exhibition" Cultural-Product Worldbuilding',
      "portfolio-card-meta-2": "Creative setting · Mythology-based IP system",
      "portfolio-card-body-2":
        "Built around the World Tree, this concept translates Maya deities such as the jaguar god, feathered serpent, rain god, and maize god into an expandable character system for exhibition-related merchandise.",
      "portfolio-card-cta-2": "Open project ↗",
      "portfolio-chip-3": "Project 03",
      "portfolio-card-title-3":
        '"The Explorer\'s Gazette" Bestiary Promotional Brochure',
      "portfolio-card-meta-3": "Brochure copy · Newspaper-style worldbuilding",
      "portfolio-card-body-3":
        "Framed as a fantasy newspaper special issue set in 1625, this brochure connects monster attacks, wanted notices, siren cave bulletins, and expedition ads into a continuous promotional reading experience.",
      "portfolio-card-cta-3": "Open project ↗",
      "field-section-label": "Field Notes",
      "field-section-title": "Practice & Fieldwork",
      "timeline-chip": "Timeline",
      "timeline-title-1": "China Museums Association · Office Intern",
      "timeline-body-1":
        "Participated in planning and on-site execution for the Second Museology Conference, handling conference copy, guest coordination, and event support, while also assisting with the seventh council transition.",
      "timeline-title-2":
        "Youth Forum Speaker at International Museum Day China Main Venue",
      "timeline-body-2":
        "Presented research at the Youth Forum of International Museum Day in China, with related media coverage and an interview by CGTN.",
      "timeline-title-3":
        "Anhui Provincial Institute of Cultural Relics and Archaeology · Excavation Intern",
      "timeline-body-3":
        "Took part in archaeological excavation and field documentation, deepening an understanding of material culture, field communication, and public interpretation.",
      "practice-chip-1": "Projects",
      "practice-title-1": "Audience Evaluation Projects",
      "practice-chip-2": "Curation",
      "practice-title-2": "Curatorial & Exhibition Writing",
      "evidence-title-1": "Audience research and field communication",
      "evidence-title-2": "Presentation at the International Museum Day forum",
      "evidence-title-3":
        "Research output related to Museum Management",
      "evidence-title-4": "CSSCI extended-edition indexing certificate",
      "contact-section-label": "Contact & Education",
      "contact-section-title": "Contact & Education",
      "contact-card-chip": "Contact",
      "contact-card-code": "Open for research & curatorial collaboration",
      "contact-card-title": "Let's Connect",
      "contact-card-body":
        "If you are also working on museum audience research, exhibition rhetoric, label writing, or curatorial collaboration, feel free to reach out by email.",
      "education-card-chip": "Education",
      "education-card-code": "Academic Record",
      "education-title-1":
        "Nanjing University · M.A. in History (Museum Studies)",
      "education-body-1":
        "Sep 2024 — Jun 2027 · Top 5% GPA · National Scholarship / First-Class Academic Scholarship",
      "education-title-2":
        "Huaibei Normal University · B.A. in History (Cultural Heritage)",
      "education-body-2":
        "Sep 2020 — Jun 2024 · Top 5% GPA · Anhui Outstanding Graduate / First-Class Scholarship",
      "methods-card-chip": "Methods",
      "methods-card-code": "Toolbox",
      "methods-card-title": "Methods & Tools",
      "printed-label": "Printed on",
      "footer-brand": "Yuexin Guo Archive",
    },
    html: {
      "profile-list": `
        <li>Institute of Archaeology, Museology and Chinese Civilization, Nanjing University</li>
        <li>Research interests: museum audience research, museum rhetoric</li>
        <li>National Scholarship / First-Class Academic Scholarship</li>
        <li>Speaker at the Youth Forum of International Museum Day China Main Venue</li>
      `,
      "direction-list-1": `
        <li>Methods: UGC text analysis, reflexive thematic analysis, interviews, surveys, and visualization</li>
        <li>Cases: Liaoning Provincial Museum, Henan Museum, Hohhot Laoniu Children's Discovery Museum, and more</li>
        <li>Output: Sole-authored article in Chinese Museum and continuing research on interest-community audiences</li>
      `,
      "direction-list-2": `
        <li>Selected for the 2025 Jiangsu Graduate Practice and Innovation Program</li>
        <li>The paper "From Narrative to Rhetoric" was published in Science Education and Museums</li>
        <li>Participated in armor exhibition projects and curatorial/worldbuilding work for the Shanghai Museum Maya exhibition</li>
      `,
      "practice-list-1": `
        <li>"Reconstructing the Past through Images": generative 3D modeling for cultural relic interaction, responsible for textual adaptation</li>
        <li>Evaluation of cultural-product appeal at Liaoning Provincial Museum, completing 30+ valid in-depth interviews</li>
        <li>Audience evaluation for the Mexico Maya Civilization exhibition at Henan Museum, contributing to survey and interview design</li>
        <li>Evaluation support for the cave-temple themed project exhibition at China Science and Technology Museum</li>
      `,
      "practice-list-2": `
        <li>Interned at Kunyuan Cultural Heritage, contributing to armor exhibition projects and display texts</li>
        <li>Participated in curatorial collaboration and worldbuilding writing for the Shanghai Museum Maya exhibition</li>
        <li>Focused on the alignment between exhibition narrative, spatial language, and audience entry points</li>
      `,
      "methods-list": `
        <li>Textual and qualitative analysis: UGC, grounded coding, reflexive thematic analysis</li>
        <li>Quantitative and support tools: Python, SPSS, MySQL, NVivo</li>
        <li>Office and collaboration: Excel, Word, ChatGPT</li>
        <li>Language: CET-4 495 / CET-6 501</li>
      `,
    },
  },
};

const defaultContent = {
  title: document.title,
  description: pageDescription?.getAttribute("content") || "",
  texts: {},
  html: {},
};

for (const id of Object.keys(translations.en.texts)) {
  const element = document.getElementById(id);
  defaultContent.texts[id] = element?.textContent?.trim() || "";
}

for (const id of Object.keys(translations.en.html)) {
  const element = document.getElementById(id);
  defaultContent.html[id] = element?.innerHTML || "";
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function setHTML(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.innerHTML = value.trim();
  }
}

function setDialState(dial, value, rotationMap) {
  if (!dial) {
    return;
  }

  dial.style.setProperty("--dial-rotation", `${rotationMap[value]}deg`);

  dial.querySelectorAll("[data-option]").forEach((label) => {
    const active = label.getAttribute("data-option") === value;
    label.classList.toggle("is-active", active);
  });
}

function resolveThemeMode() {
  const savedMode = localStorage.getItem(themeModeStorageKey);
  return themeModes.includes(savedMode) ? savedMode : "system";
}

function resolveLanguage() {
  const savedLanguage = localStorage.getItem(languageStorageKey);
  return languages.includes(savedLanguage) ? savedLanguage : "zh";
}

function getResolvedTheme(mode) {
  if (mode === "system") {
    return systemThemeMedia.matches ? "dark" : "light";
  }

  return mode;
}

function updateThemeDialLabel(mode, language = root.dataset.lang || "zh") {
  if (!themeToggle) {
    return;
  }

  const labels =
    language === "en"
      ? {
          system: "System theme selected, switch to light",
          light: "Light theme selected, switch to dark",
          dark: "Dark theme selected, switch to system",
        }
      : {
          system: "当前跟随系统，点击切换到浅色",
          light: "当前浅色，点击切换到深色",
          dark: "当前深色，点击切换到跟随系统",
        };

  const title = labels[mode];
  themeToggle.setAttribute("aria-label", title);
  themeToggle.setAttribute("title", title);

  if (themeToggleLabel) {
    themeToggleLabel.textContent = title;
  }
}

function updateLanguageDialLabel(language) {
  if (!languageToggle) {
    return;
  }

  const title = language === "zh" ? "切换到英文" : "Switch to Chinese";
  languageToggle.setAttribute("aria-label", title);
  languageToggle.setAttribute("title", title);

  if (languageToggleLabel) {
    languageToggleLabel.textContent = title;
  }
}

function updatePrintButtonLabel(language) {
  if (!printButton) {
    return;
  }

  const title = language === "en" ? "Print page" : "打印页面";
  printButton.setAttribute("aria-label", title);
  printButton.setAttribute("title", title);

  if (printLabel) {
    printLabel.textContent = title;
  }
}

function applyThemeMode(mode, { persist = true } = {}) {
  const resolvedTheme = getResolvedTheme(mode);
  root.dataset.themeMode = mode;
  root.dataset.theme = resolvedTheme;
  setDialState(themeDial, mode, themeDialRotation);
  updateThemeDialLabel(mode);

  if (persist) {
    localStorage.setItem(themeModeStorageKey, mode);
  }
}

function setPrintedDate(language) {
  if (!printedDate) {
    return;
  }

  const formatter = new Intl.DateTimeFormat(language === "en" ? "en-US" : "zh-CN", {
    year: "numeric",
    month: language === "en" ? "short" : "2-digit",
    day: "2-digit",
  });

  printedDate.textContent = formatter.format(new Date());
}

function applyLanguage(language, { persist = true } = {}) {
  const translation = language === "en" ? translations.en : defaultContent;
  root.dataset.lang = language;
  root.lang = language === "en" ? "en" : "zh-CN";
  document.title = translation.title;

  if (pageDescription) {
    pageDescription.setAttribute("content", translation.description);
  }

  Object.entries(translation.texts).forEach(([id, value]) => {
    setText(id, value);
  });

  Object.entries(translation.html).forEach(([id, value]) => {
    setHTML(id, value);
  });

  setPrintedDate(language);
  setDialState(languageDial, language, languageDialRotation);
  updateLanguageDialLabel(language);
  updateThemeDialLabel(root.dataset.themeMode || "system", language);
  updatePrintButtonLabel(language);

  if (persist) {
    localStorage.setItem(languageStorageKey, language);
  }
}

function cycleValue(current, values) {
  const currentIndex = values.indexOf(current);
  const nextIndex = (currentIndex + 1) % values.length;
  return values[nextIndex];
}

function playPaperFeedAnimation() {
  if (!paperMotion || prefersReducedMotion.matches) {
    return;
  }

  paperMotion.getAnimations().forEach((animation) => animation.cancel());

  paperMotion.animate(
    [
      { offset: 0, transform: "translateY(-56px)" },
      { offset: 0.24, transform: "translateY(-28px)" },
      { offset: 0.46, transform: "translateY(-32px)" },
      { offset: 0.72, transform: "translateY(-10px)" },
      { offset: 1, transform: "translateY(0)" },
    ],
    {
      duration: 680,
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
  if (!sections.length) {
    return;
  }

  let ticking = false;

  const syncActiveLinkToScroll = () => {
    ticking = false;

    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
      markActiveLink(sections[sections.length - 1].id);
      return;
    }

    const marker = window.scrollY + Math.min(window.innerHeight * 0.35, 240);
    let activeSectionId = sections[0].id;

    for (const section of sections) {
      if (section.offsetTop <= marker) {
        activeSectionId = section.id;
      } else {
        break;
      }
    }

    markActiveLink(activeSectionId);
  };

  const requestSync = () => {
    if (ticking) {
      return;
    }

    ticking = true;
    window.requestAnimationFrame(syncActiveLinkToScroll);
  };

  requestSync();
  window.addEventListener("scroll", requestSync, { passive: true });
  window.addEventListener("resize", requestSync);
  window.addEventListener("hashchange", requestSync);
}

function bindNavigation() {
  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      markActiveLink(link.getAttribute("href")?.slice(1) || "home");
      playPaperFeedAnimation();
    });
  });
}

const initialThemeMode = resolveThemeMode();
const initialLanguage = resolveLanguage();

applyThemeMode(initialThemeMode, { persist: false });
applyLanguage(initialLanguage, { persist: false });
observeSections();
bindNavigation();
playPaperFeedAnimation();

systemThemeMedia.addEventListener("change", () => {
  if (root.dataset.themeMode === "system") {
    applyThemeMode("system", { persist: false });
  }
});

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const currentMode = root.dataset.themeMode || "system";
    const nextMode = cycleValue(currentMode, themeModes);
    applyThemeMode(nextMode);
  });
}

if (languageToggle) {
  languageToggle.addEventListener("click", () => {
    const currentLanguage = root.dataset.lang || "zh";
    const nextLanguage = cycleValue(currentLanguage, languages);
    applyLanguage(nextLanguage);
    playPaperFeedAnimation();
  });
}

if (printButton) {
  printButton.addEventListener("click", () => {
    window.print();
  });
}
