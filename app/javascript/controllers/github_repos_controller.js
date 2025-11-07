import { Controller } from "@hotwired/stimulus"

const repoCache = new Map()
const pendingFetches = new Map()

async function fetchRepos(username, perPage) {
  if (!username) {
    throw new Error("Missing GitHub username")
  }

  if (repoCache.has(username)) {
    return repoCache.get(username)
  }

  if (!pendingFetches.has(username)) {
    const url = new URL(`https://api.github.com/users/${encodeURIComponent(username)}/repos`)
    url.searchParams.set("per_page", perPage)
    url.searchParams.set("sort", "updated")
    url.searchParams.set("direction", "desc")

    const promise = fetch(url.toString())
      .then(response => {
        if (!response.ok) {
          throw new Error("Failed to fetch repositories")
        }
        return response.json()
      })
      .then(repos => {
        repoCache.set(username, repos)
        pendingFetches.delete(username)
        return repos
      })
      .catch(error => {
        pendingFetches.delete(username)
        throw error
      })

    pendingFetches.set(username, promise)
  }

  return pendingFetches.get(username)
}

export default class extends Controller {
  static values = {
    username: String,
    perPage: { type: Number, default: 100 }
  }

  connect() {
    this.renderLoading()
    this.loadRepositories()
  }

  async loadRepositories() {
    try {
      const repos = await fetchRepos(this.usernameValue, this.perPageValue)
      this.render(repos)
    } catch (error) {
      console.error("Error fetching GitHub repos:", error)
      this.renderError()
    }
  }

  render(repos) {
    if (!Array.isArray(repos) || repos.length === 0) {
      this.element.innerHTML = "No public repositories found."
      return
    }

    this.element.innerHTML = repos.map(repo => this.repoHTML(repo)).join("")
  }

  repoHTML(repo) {
    const description = repo.description || ""
    const updatedAt = new Date(repo.updated_at)
    const formattedDate = updatedAt.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric"
    })

    return `
      <div class="github-repo">
        <div class="github-repo-name">
          <a href="${repo.html_url}" target="_blank" rel="noopener">${repo.name}</a>
        </div>
        <div class="github-repo-description">
          <p>${description}</p>
        </div>
        <div class="github-repo-time">
          <a href="${repo.html_url}" target="_blank" rel="noopener">
            Last updated on ${formattedDate}
          </a>
        </div>
      </div>
    `
  }

  renderLoading() {
    this.element.textContent = "Loading..."
  }

  renderError() {
    this.element.textContent = "There was an error fetching the repositories."
  }
}
