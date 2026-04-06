const { site, enhancePostHtml, htmlToText } = require("../utils/site");

function escapeXml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

module.exports = class {
  data() {
    return {
      permalink: "/feed.xml"
    };
  }

  render(data) {
    const items = data.collections.posts.slice(0, 25).map((post) => {
      const title = post.data.title;
      const content = enhancePostHtml(post.templateContent, post.data);
      const guid = `${site.url}${post.url}`;
      return `
  <item>
    ${title ? `<title>${escapeXml(title)}</title>` : ""}
    <link>${site.url}${post.url}</link>
    <guid>${escapeXml(guid)}</guid>
    <pubDate>${new Date(post.date).toUTCString()}</pubDate>
    <description><![CDATA[${content}]]></description>
    <content:encoded><![CDATA[${content}]]></content:encoded>
  </item>`;
    }).join("\n");

    return `<?xml version="1.0" encoding="utf-8"?>
<?xml-stylesheet type="text/css" href="/assets/stylesheets/rss-feed.css"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(site.title)}</title>
    <link>${site.url}/</link>
    <description>${escapeXml(site.description)}</description>
    <language>${site.lang}</language>
    <atom:link href="${site.url}/feed.xml" rel="self" type="application/rss+xml"/>
    <script xmlns="http://www.w3.org/1999/xhtml" src="/assets/scripts/feed.js"></script>${items}
  </channel>
</rss>`;
  }
};
