const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");
const MarkdownIt = require("markdown-it");
const site = require("../config/site");

const markdown = new MarkdownIt({ html: true, breaks: true, linkify: true });
const matterCache = new Map();

function normalizeDomain(value) {
  return String(value || "").replaceAll("https://nunes.uk/", `${site.url}/`);
}

function stripHtml(value) {
  return normalizeDomain(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripMarkdown(value) {
  return stripHtml(
    String(value || "")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
  )
    .replace(/^\s*-\s+/gm, "")
    .replace(/[*_`>#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function truncateWords(value, count) {
  const words = String(value || "").trim().split(/\s+/).filter(Boolean);
  if (words.length <= count) {
    return words.join(" ");
  }

  return `${words.slice(0, count).join(" ")}…`;
}

function getMatter(inputPath) {
  if (!matterCache.has(inputPath)) {
    matterCache.set(inputPath, matter.read(inputPath));
  }

  return matterCache.get(inputPath);
}

function getRawBody(inputPath) {
  return getMatter(inputPath).content.trim();
}

function inferPermalink(data) {
  if (data.url) {
    return data.url;
  }

  const date = new Date(data.date);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const slug = String(data.page.fileSlug || "post").replace(/^\d{4}-\d{2}-\d{2}-/, "");

  return `/${year}/${month}/${day}/${slug}/`;
}

function isPhotoPost(rawBody) {
  const body = normalizeDomain(rawBody);
  return body.includes("📷") && (/!\[[^\]]*\]\([^)]*\)/.test(body) || /<img\b/i.test(body));
}

function getFirstImageUrl(rawBody, data = {}) {
  const body = normalizeDomain(rawBody);
  const markdownMatch = body.match(/!\[[^\]]*\]\(([^)]+)\)/);
  if (markdownMatch) {
    return markdownMatch[1];
  }

  const htmlMatch = body.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (htmlMatch) {
    return htmlMatch[1];
  }

  const photos = Array.isArray(data.photos) ? data.photos : [];
  const images = Array.isArray(data.images) ? data.images : [];
  return normalizeDomain(photos[0] || images[0] || "");
}

function renderMarkdown(value) {
  return normalizeDomain(markdown.render(value || "").trim());
}

function getSummarySource(rawBody) {
  const body = String(rawBody || "").trim();
  if (!body) {
    return "";
  }

  const moreIndex = body.indexOf("<!--more-->");
  if (moreIndex >= 0) {
    return body.slice(0, moreIndex).trim();
  }

  if (body.startsWith("<")) {
    const match = body.match(/<p[\s\S]*?<\/p>/i);
    return match ? match[0] : body;
  }

  return body.split(/\n\s*\n/)[0].trim();
}

function getIndexExcerptSource(rawBody, data = {}) {
  const summary = String(data.summary || "").trim();
  if (summary) {
    return summary;
  }

  const body = String(rawBody || "").trim();
  const moreIndex = body.indexOf("<!--more-->");
  if (moreIndex >= 0) {
    return body.slice(0, moreIndex).trim();
  }

  return body;
}

function getIndexExcerpt(rawBody, data = {}, wordLimit = 70) {
  return truncateWords(stripMarkdown(getIndexExcerptSource(rawBody, data)), wordLimit);
}

function hasIndexExcerptMore(rawBody, data = {}, wordLimit = 70) {
  const sourceText = stripMarkdown(getIndexExcerptSource(rawBody, data));
  const fullText = stripMarkdown(rawBody);
  const excerpt = truncateWords(sourceText, wordLimit);

  return excerpt !== sourceText || sourceText !== fullText;
}

function getPostName(title, rawBody) {
  if (title) {
    return stripHtml(title);
  }

  const summary = stripMarkdown(getSummarySource(rawBody));
  return summary.slice(0, 80) || "Untitled post";
}

function addPhotoClass(html) {
  return html.replace(/<img\b([^>]*?)>/gi, (match, attrs) => {
    if (/class=["'][^"']*u-photo/.test(attrs)) {
      return `<img${attrs}>`;
    }

    if (/class=["']([^"']*)["']/.test(attrs)) {
      return `<img${attrs.replace(/class=["']([^"']*)["']/, 'class="$1 u-photo"')}>`;
    }

    return `<img class="u-photo"${attrs}>`;
  });
}

function enhancePostHtml(html, data = {}) {
  let output = normalizeDomain(html || "");

  if (data.isPhotoPost) {
    output = addPhotoClass(output);
  }

  return output;
}

function getSyndicationUrls(data = {}) {
  const urls = [];
  const add = (value) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach(add);
      return;
    }
    const normalized = normalizeDomain(value);
    if (normalized && !urls.includes(normalized)) {
      urls.push(normalized);
    }
  };

  add(data.syndication);

  return urls;
}

function formatDate(date, locale = "en-GB", options = {}) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options
  }).format(new Date(date));
}

function htmlToText(html) {
  return stripHtml(html).replace(/\s+/g, " ").trim();
}

module.exports = {
  site,
  markdown,
  getRawBody,
  inferPermalink,
  isPhotoPost,
  getFirstImageUrl,
  renderMarkdown,
  getSummarySource,
  getIndexExcerpt,
  hasIndexExcerptMore,
  getPostName,
  enhancePostHtml,
  getSyndicationUrls,
  formatDate,
  htmlToText,
  normalizeDomain
};
