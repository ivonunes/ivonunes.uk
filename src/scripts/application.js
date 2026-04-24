import "@hotwired/turbo";

const State = {
  gitHubRepos: null,
  clickTime: null,
  activeTarget: null,
  lastHover: null
};

const GitHubRepos = {
  customProjects: [
    {
      html_url: "https://www.mythblade.com",
      name: "mythblade",
      description: "Online role playing game.",
      metaLabel: "Visit website"
    },
    {
      html_url: "https://mooziko.com",
      name: "mooziko",
      description: "Solo music project blending alternative rock with indie influences.",
      metaLabel: "Visit website"
    }
  ],

  async fetch() {
    if (State.gitHubRepos) return;

    try {
      const response = await fetch("https://api.github.com/users/ivonunes/repos?per_page=100&sort=updated&direction=desc");

      if (!response.ok) {
        throw new Error("Failed to fetch repositories");
      }

      State.gitHubRepos = await response.json();
    } catch (error) {
      console.error("Error fetching repositories:", error);
    }
  },

  formatDescription(description) {
    const text = (description || "").trim();
    if (!text) return "";

    return text.endsWith(".") ? text : `${text}.`;
  },

  createRepoHTML(repo) {
    const metaLabel = repo.updated_at
      ? "View source"
      : repo.metaLabel || "";
    const description = this.formatDescription(repo.description);
    const metaHTML = metaLabel
      ? `
        <div class="microblog_time">
          <a href="${repo.html_url}" target="_blank" rel="noopener">
            ${metaLabel}
          </a>
        </div>
      `
      : "";

    return `
      <div class="microblog_post">
        <div class="microblog_user">
          <a href="${repo.html_url}" target="_blank" rel="noopener">${repo.name}</a>
        </div>
        <div class="microblog_text">
          <p>${description}</p>
        </div>
        ${metaHTML}
      </div>
    `;
  },

  createRepoSection(title, repos) {
    if (repos.length === 0) return "";

    const heading = title ? `<h2>${title}</h2>` : "";
    const items = repos.map((repo) => this.createRepoHTML(repo)).join("");

    return `<div class="repo-section">${heading}${items}</div>`;
  },

  render() {
    const repoContainer = document.querySelector(".microblog_conversation.github-repos");
    if (!repoContainer) return;

    if (!State.gitHubRepos) {
      repoContainer.innerHTML = "There was an error fetching the repositories.";
      return;
    }

    const [featuredProject, ...trailingProjects] = this.customProjects;
    const activeRepos = [featuredProject, ...State.gitHubRepos.filter((repo) => !repo.archived), ...trailingProjects];
    const archivedRepos = State.gitHubRepos.filter((repo) => repo.archived);

    repoContainer.innerHTML = [
      this.createRepoSection("", activeRepos),
      this.createRepoSection("Archived", archivedRepos)
    ].join("");
  },

  async init() {
    await this.fetch();
    this.render();
  }
};

const NavigationTabs = {
  elements: {
    mainTabs: null,
    mainSliderCircle: null,
    navLinks: null
  },

  init() {
    this.elements.mainTabs = document.querySelector(".main-tabs");
    this.elements.mainSliderCircle = document.querySelector(".main-slider-circle");
    this.elements.navLinks = document.querySelectorAll(".nav-link");

    if (!this.elements.mainTabs || !this.elements.mainSliderCircle) return;

    this.setupInitialState();
    this.attachEventListeners();
  },

  setupInitialState() {
    const activeLink = document.querySelector(".nav-link.active");
    if (!activeLink) return;

    const shouldUpdate =
      (State.activeTarget && activeLink.href !== State.activeTarget.href) ||
      (State.activeTarget === null && activeLink.dataset.translateValue !== "0");

    if (shouldUpdate) {
      State.activeTarget = activeLink;
      this.updateSlider(activeLink);
      this.handleActiveTab(activeLink, "active");
    } else if (State.activeTarget === null) {
      State.activeTarget = activeLink;
      State.lastHover = activeLink.href;
    }
  },

  updateSlider(target) {
    const root = document.documentElement;
    const translateValue = target.dataset.translateValue;

    this.elements.mainSliderCircle.classList.remove("animate-liquid");
    void this.elements.mainSliderCircle.offsetWidth;
    this.elements.mainSliderCircle.classList.add("animate-liquid");

    root.style.setProperty("--translate-main-slider", translateValue);
  },

  handleActiveTab(target, className) {
    State.lastHover = target.href;

    this.elements.navLinks.forEach((tab) => {
      tab.classList.remove(className);
    });

    if (!target.classList.contains(className)) {
      target.classList.add(className);
    }
  },

  handleNavLinkEvent(event) {
    if (!event.target.classList.contains("nav-link")) return;

    this.updateSlider(event.target);
    this.handleActiveTab(event.target, "active");
  },

  attachEventListeners() {
    this.elements.mainTabs.addEventListener("mouseover", (event) => {
      if (event.target.classList.contains("nav-link") && event.target.href !== State.lastHover) {
        this.handleNavLinkEvent(event);
      }
    });

    this.elements.mainTabs.addEventListener("mouseleave", () => {
      if (State.activeTarget && State.activeTarget.classList.contains("nav-link") && State.activeTarget.href !== State.lastHover) {
        this.updateSlider(State.activeTarget);
        this.handleActiveTab(State.activeTarget, "active");
      }
    });

    this.elements.mainTabs.addEventListener("click", (event) => {
      if (event.target.classList.contains("nav-link")) {
        State.activeTarget = event.target;
        this.handleNavLinkEvent(event);
      }
    });
  }
};

const TurboHandlers = {
  handleLoad() {
    const wrapper = document.querySelector(".wrapper");
    if (wrapper) {
      wrapper.classList.remove("animate__slideOutDown", "animate__faster");
      if (!wrapper.classList.contains("animate__slideInUp")) {
        wrapper.classList.add("animate__slideInUp");
      }
    }

    if (document.querySelector(".github-repos")) {
      GitHubRepos.init();
    }

    NavigationTabs.init();
  },

  handleBeforeCache() {
    const wrapper = document.querySelector(".wrapper");
    if (wrapper) {
      wrapper.classList.remove("animate__slideOutDown", "animate__faster");
      if (!wrapper.classList.contains("animate__slideInUp")) {
        wrapper.classList.add("animate__slideInUp");
      }
    }
  },

  async handleBeforeRender(event) {
    event.preventDefault();

    event.detail.newBody.querySelector(".header")?.classList.remove("animate__animated", "animate__fadeInDown");
    event.detail.newBody.querySelector(".wrapper")?.classList.add("animate__faster");

    const currentTime = new Date().getTime();
    const timeSinceClick = currentTime - State.clickTime;
    const timeout = Math.max(0, 250 - timeSinceClick);

    await new Promise((resolve) => setTimeout(resolve, timeout));
    event.detail.resume();
  },

  handleClick() {
    const wrapper = document.querySelector(".wrapper");
    if (wrapper) {
      wrapper.classList.remove("animate__slideInUp");
      wrapper.classList.add("animate__slideOutDown", "animate__faster");
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
    State.clickTime = new Date().getTime();
  }
};

window.GitHubRepos = GitHubRepos;
document.addEventListener("touchstart", function () {}, false);
document.addEventListener("turbo:load", TurboHandlers.handleLoad);
document.addEventListener("turbo:before-cache", TurboHandlers.handleBeforeCache);
document.addEventListener("turbo:before-render", TurboHandlers.handleBeforeRender);
document.addEventListener("turbo:click", TurboHandlers.handleClick);
