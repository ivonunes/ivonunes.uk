let gitHubRepos = null;

function displayRepos() {
	const repoContainer = document.querySelector('.microblog_conversation');
	repoContainer.innerHTML = '';
	
	if (gitHubRepos) {
		for(let i = 0; i < gitHubRepos.length; i++) {
			repoContainer.innerHTML += `<div class="microblog_post"><div class="microblog_user"><a href="${gitHubRepos[i].html_url}" target="_blank">${gitHubRepos[i].name}</a></div><div class="microblog_text"><p>${gitHubRepos[i].description || ''}</p></div><div class="microblog_time"><a href="${gitHubRepos[i].html_url}" target="_blank">Last updated on ${formatDate(gitHubRepos[i].updated_at)}</a></div></div>`;
		}
	} else {
		repoContainer.innerHTML = 'There was an error fetching the repositories.';
	}
}

function formatDate(dateString) {
	const options = { year: "numeric", month: "long", day: "numeric" };
	return new Date(dateString).toLocaleDateString(undefined, options);
}
	
async function getRepos(url) {
	if (!gitHubRepos) {
		try {
			const data = await fetch("https://api.github.com/users/ivonunes/repos?per_page=100&sort=updated&direction=desc");
			gitHubRepos = await data.json();
		} catch (e) {}
	}

	displayRepos();
}

async function getComments(url) {
	const fetchUrl = "https://micro.blog/conversation.js?url=" + url;

	try {
		const response = await fetch(fetchUrl);
		if (response.ok) {
			let buffer = '';
			window.writeToBuffer = function (text) {
				buffer += text;
			}

			let result = await response.text();
			result = result.replaceAll('document.write', 'window.writeToBuffer');

			(new Function(result))();
			window.writeToBuffer = null;

			document.querySelector('.microblog_conversation_wrapper').innerHTML = buffer;
		}
	} catch (error) {
	}
}

const navLink = document.querySelectorAll(".nav-link");
const body = document.querySelector("body");
const hamburger = document.querySelector(".hamburger");

hamburger.addEventListener("click", mobileMenu);
navLink.forEach(n => n.addEventListener("click", closeMenu));

function mobileMenu() {
	window.scrollTo({top: 0, behavior: 'smooth'});
	body.classList.toggle("mobile-nav-open");
}

function closeMenu() {
	body.classList.remove("mobile-nav-open");
}

if (document.querySelector(".github-repos")) {
	getRepos();
}
