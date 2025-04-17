let gitHubRepos = null;
let clickTime = null;

document.addEventListener('touchstart', function () {}, false);

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString(undefined, {year: "numeric", month: "long", day: "numeric"});
}

async function fetchRepos() {
  if (gitHubRepos) return;

  try {
    const response = await fetch("https://api.github.com/users/ivonunes/repos?per_page=100&sort=updated&direction=desc");
    if (!response.ok) throw new Error("Failed to fetch repositories");
    gitHubRepos = await response.json();
  } catch (error) {
    console.error("Error fetching GitHub repos:", error);
  }
}

function displayRepos() {
  const repoContainer = document.querySelector(".microblog_conversation.github-repos");
  if (!repoContainer) return;

  if (!gitHubRepos) {
    repoContainer.innerHTML = "There was an error fetching the repositories.";
    return;
  }

  repoContainer.innerHTML = gitHubRepos.map(repo => `
        <div class="microblog_post">
            <div class="microblog_user">
                <a href="${repo.html_url}" target="_blank">${repo.name}</a>
            </div>
            <div class="microblog_text">
                <p>${repo.description || ""}</p>
            </div>
            <div class="microblog_time">
                <a href="${repo.html_url}" target="_blank">Last updated on ${formatDate(repo.updated_at)}</a>
            </div>
        </div>
    `).join("");
}

async function getRepos() {
  await fetchRepos();
  displayRepos();
}

async function getComments(url) {
  try {
    const response = await fetch(`https://micro.blog/conversation.js?url=${url}`);
    if (!response.ok) throw new Error("Failed to fetch comments");

    let buffer = "";
    window.writeToBuffer = text => buffer += text;
    window.pushState = (data, title, url) => {
      if (new URLSearchParams(window.location.search).get("token")) {
        history.pushState(data, title, url);
      }
    };

    let result = await response.text();
    result = result.replaceAll("document.write", "window.writeToBuffer").replaceAll("history.pushState", "window.pushState");

    (new Function(result))();

    window.writeToBuffer = undefined;
    window.pushState = undefined;

    document.querySelector(".microblog_conversation_wrapper").innerHTML = buffer;
  } catch (error) {
    console.error("Error fetching comments:", error);
  }
}

document.addEventListener("turbo:load", () => {
  if (document.querySelector(".github-repos")) {
    getRepos();
  }

  for (const btn of document.querySelectorAll('.site-nav a')) {
    btn.onclick = function() {
        btn.classList.add('active');

        setTimeout(function() {
            btn.classList.remove('active');        
        }, 500);
    };
  }
});

document.addEventListener("turbo:before-render", async (event) => {
  event.preventDefault();
  event.detail.newBody.querySelector(".header")?.classList.remove("animate__animated", "animate__fadeInDown");
  event.detail.newBody.querySelector(".wrapper")?.classList.add("animate__faster");

  const currentTime = new Date().getTime();
  const timeSinceClick = currentTime - clickTime;
  const timeout = Math.max(0, 250 - timeSinceClick);
  await new Promise(resolve => setTimeout(resolve, timeout));

  event.detail.resume();
});

document.addEventListener("turbo:click", (event) => {
  document.querySelector(".wrapper")?.classList.remove("animate__fadeInUp");
  window.scrollTo({top: 0, behavior: 'smooth'});
  document.querySelector(".wrapper")?.classList.add("animate__fadeOutDown", "animate__faster");

  clickTime = new Date().getTime();
});
