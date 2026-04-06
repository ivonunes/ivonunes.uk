const { site } = require("../utils/site");

module.exports = class {
  data() {
    return { permalink: "/sitemap.xml" };
  }

  render(data) {
    const urls = [
      "/",
      "/photos/",
      "/projects/",
      ...data.collections.posts.map((post) => post.url)
    ];

    const uniqueUrls = [...new Set(urls)];

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueUrls.map((url) => `  <url><loc>${site.url}${url}</loc></url>`).join("\n")}
</urlset>`;
  }
};
