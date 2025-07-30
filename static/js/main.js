const SiteState = {
  gitHubRepos: null,
  clickTime: null,
  activeTarget: null,
  lastHover: null
};

document.addEventListener('touchstart', function () {}, false);

const Utils = {
  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric", 
      month: "long", 
      day: "numeric"
    });
  },

  querySelector(selector) {
    return document.querySelector(selector);
  },

  querySelectorAll(selector) {
    return document.querySelectorAll(selector);
  }
};

const GitHubRepos = {
  async fetch() {
    if (SiteState.gitHubRepos) return;

    try {
      const response = await fetch(
        "https://api.github.com/users/ivonunes/repos?per_page=100&sort=updated&direction=desc"
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch repositories");
      }
      
      SiteState.gitHubRepos = await response.json();
    } catch (error) {
      console.error("Error fetching GitHub repos:", error);
    }
  },

  createRepoHTML(repo) {
    return `
      <div class="microblog_post">
        <div class="microblog_user">
          <a href="${repo.html_url}" target="_blank">${repo.name}</a>
        </div>
        <div class="microblog_text">
          <p>${repo.description || ""}</p>
        </div>
        <div class="microblog_time">
          <a href="${repo.html_url}" target="_blank">
            Last updated on ${Utils.formatDate(repo.updated_at)}
          </a>
        </div>
      </div>
    `;
  },

  display() {
    const repoContainer = Utils.querySelector(".microblog_conversation.github-repos");
    if (!repoContainer) return;

    if (!SiteState.gitHubRepos) {
      repoContainer.innerHTML = "There was an error fetching the repositories.";
      return;
    }

    repoContainer.innerHTML = SiteState.gitHubRepos
      .map(repo => this.createRepoHTML(repo))
      .join("");
  },

  async init() {
    await this.fetch();
    this.display();
  }
};

const MicroblogComments = {
  async get(url) {
    try {
      const response = await fetch(`https://micro.blog/conversation.js?url=${url}`);
      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }

      let buffer = "";
      
      window.writeToBuffer = text => buffer += text;
      window.pushState = (data, title, url) => {
        if (new URLSearchParams(window.location.search).get("token")) {
          history.pushState(data, title, url);
        }
      };

      let result = await response.text();
      result = result
        .replaceAll("document.write", "window.writeToBuffer")
        .replaceAll("history.pushState", "window.pushState");

      (new Function(result))();

      window.writeToBuffer = undefined;
      window.pushState = undefined;

      const conversationWrapper = Utils.querySelector(".microblog_conversation_wrapper");
      if (conversationWrapper) {
        conversationWrapper.innerHTML = buffer;
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  }
};

const NavigationTabs = {
  elements: {
    mainTabs: null,
    mainSliderCircle: null,
    navLinks: null
  },

  init() {
    this.elements.mainTabs = Utils.querySelector(".main-tabs");
    this.elements.mainSliderCircle = Utils.querySelector(".main-slider-circle");
    this.elements.navLinks = Utils.querySelectorAll(".nav-link");

    if (!this.elements.mainTabs) return;

    this.setupInitialState();
    this.attachEventListeners();
  },

  setupInitialState() {
    const activeLink = Utils.querySelector(".nav-link.active");
    const shouldUpdate = (SiteState.activeTarget && activeLink.href !== SiteState.activeTarget.href) || 
                        (SiteState.activeTarget === null && activeLink.dataset.translateValue !== "0");

    if (shouldUpdate) {
      SiteState.activeTarget = activeLink;
      this.updateSlider(activeLink);
      this.handleActiveTab(activeLink, "active");
    } else if (SiteState.activeTarget === null) {
      SiteState.activeTarget = activeLink;
      SiteState.lastHover = activeLink.href;
    }
  },

  updateSlider(target) {
    const root = document.documentElement;
    const translateValue = target.dataset.translateValue;

    this.elements.mainSliderCircle.classList.remove("animate-liquid");
    void this.elements.mainSliderCircle.offsetWidth; // Force reflow
    this.elements.mainSliderCircle.classList.add("animate-liquid");

    root.style.setProperty("--translate-main-slider", translateValue);
  },

  handleActiveTab(target, className) {
    SiteState.lastHover = target.href;

    this.elements.navLinks.forEach(tab => {
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
      if (event.target.classList.contains("nav-link") && 
          event.target.href !== SiteState.lastHover) {
        this.handleNavLinkEvent(event);
      }
    });

    this.elements.mainTabs.addEventListener("mouseleave", (event) => {
      if (SiteState.activeTarget && 
          SiteState.activeTarget.classList.contains("nav-link") && 
          SiteState.activeTarget.href !== SiteState.lastHover) {
        this.updateSlider(SiteState.activeTarget);
        this.handleActiveTab(SiteState.activeTarget, "active");
      }
    });

    this.elements.mainTabs.addEventListener("click", (event) => {
      if (event.target.classList.contains("nav-link")) {
        SiteState.activeTarget = event.target;
        this.handleNavLinkEvent(event);
      }
    });
  }
};

const TurboHandlers = {
  init() {
    this.attachEventListeners();
  },

  async handleBeforeRender(event) {
    event.preventDefault();
    
    event.detail.newBody.querySelector(".header")
      ?.classList.remove("animate__animated", "animate__fadeInDown");
    event.detail.newBody.querySelector(".wrapper")
      ?.classList.add("animate__faster");

    const currentTime = new Date().getTime();
    const timeSinceClick = currentTime - SiteState.clickTime;
    const timeout = Math.max(0, 250 - timeSinceClick);
    
    await new Promise(resolve => setTimeout(resolve, timeout));
    event.detail.resume();
  },

  handleClick(event) {
    const wrapper = Utils.querySelector(".wrapper");
    if (wrapper) {
      wrapper.classList.remove("animate__slideInUp");
      wrapper.classList.add("animate__slideOutDown", "animate__faster");
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    SiteState.clickTime = new Date().getTime();
  },

  attachEventListeners() {
    document.addEventListener("turbo:before-render", (event) => {
      this.handleBeforeRender(event);
    });

    document.addEventListener("turbo:click", (event) => {
      this.handleClick(event);
    });
  }
};

const Site = {
  init() {
    if (Utils.querySelector(".github-repos")) {
      GitHubRepos.init();
    }

    NavigationTabs.init();
  }
};

document.addEventListener("turbo:load", () => {
  Site.init();
});

TurboHandlers.init();
