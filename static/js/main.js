let gitHubRepos = null;

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
  const repoContainer = document.querySelector(".microblog_conversation");
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
});
