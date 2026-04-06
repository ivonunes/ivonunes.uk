module.exports = {
  title: "Ivo Nunes",
  url: "https://ivonunes.uk",
  lang: "en",
  timezone: "Europe/London",
  description: "Software engineer. Guitar addict. Photography enthusiast. Gaming aficionado.",
  author: {
    name: "Ivo Nunes",
    email: "ivo@nunes.uk",
    avatar: "/assets/images/avatar.jpg",
    username: "ivonunes",
    bio: "Software engineer. Guitar addict.<br>Photography enthusiast. Gaming aficionado."
  },
  navigation: [
    { name: "Photos", url: "/photos/", icon: "fa-solid fa-camera-retro" },
    { name: "Projects", url: "/projects/", icon: "fa-solid fa-diagram-project" }
  ],
  social: [
    { name: "RSS", url: "/feed.xml", icon: "fa-solid fa-rss", className: "social-rss" },
    { name: "Bluesky", url: "https://bsky.app/profile/ivonunes.uk", icon: "fa-brands fa-bluesky", className: "social-bluesky" },
    { name: "Mastodon", url: "https://mastodon.social/@ivo_nunes", icon: "fa-brands fa-mastodon", className: "social-mastodon" },
    { name: "Flickr", url: "https://www.flickr.com/photos/ivonunes/", icon: "fa-brands fa-flickr", className: "social-flickr" },
    { name: "LinkedIn", url: "https://linkedin.com/in/ivonunes/", icon: "fa-brands fa-linkedin", className: "social-linkedin" },
    { name: "GitHub", url: "https://github.com/ivonunes", icon: "fa-brands fa-github", className: "social-github" },
    { name: "Email", url: "mailto:ivo@nunes.uk", icon: "fa-solid fa-envelope", className: "social-email" }
  ],
  syndication: {
    targets: [
      "https://brid.gy/publish/bluesky",
      "https://brid.gy/publish/mastodon",
      "https://brid.gy/publish/flickr"
    ]
  }
};
