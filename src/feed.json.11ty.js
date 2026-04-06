const { site, enhancePostHtml, htmlToText } = require("../utils/site");

module.exports = class {
  data() {
    return {
      permalink: "/feed.json"
    };
  }

  render(data) {
    const items = data.collections.posts.slice(0, 25).map((post) => {
      const item = {
        id: `${site.url}${post.url}`,
        url: `${site.url}${post.url}`,
        content_html: enhancePostHtml(post.templateContent, post.data),
        content_text: htmlToText(post.templateContent),
        date_published: new Date(post.date).toISOString(),
        date_modified: new Date(post.data.lastmod || post.date).toISOString()
      };

      if (post.data.title) {
        item.title = post.data.title;
      }

      return item;
    });

    return JSON.stringify({
      version: "https://jsonfeed.org/version/1.1",
      title: site.title,
      home_page_url: `${site.url}/`,
      feed_url: `${site.url}/feed.json`,
      description: site.description,
      authors: [{ name: site.author.name, url: `${site.url}/` }],
      items
    }, null, 2);
  }
};
