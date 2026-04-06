const { site, markdown, getFirstImageUrl, enhancePostHtml, renderMarkdown, getSummarySource, formatDate, htmlToText, normalizeDomain } = require("./utils/site");

module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ public: "/" });
  eleventyConfig.addPassthroughCopy({ ".cache/assets/scripts": "assets/scripts" });

  eleventyConfig.setLibrary("md", markdown);

  eleventyConfig.addCollection("posts", (collectionApi) => {
    return collectionApi.getFilteredByGlob("src/posts/*.md").sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addCollection("photoPosts", (collectionApi) => {
    return collectionApi
      .getFilteredByGlob("src/posts/*.md")
      .filter((item) => item.data.isPhotoPost)
      .sort((a, b) => b.date - a.date);
  });

  eleventyConfig.addFilter("dateDisplay", (value) => formatDate(value));
  eleventyConfig.addFilter("dateIso", (value) => new Date(value).toISOString());
  eleventyConfig.addFilter("absoluteUrl", (value = "") => new URL(String(value).replace(/^\//, ""), `${site.url}/`).toString());
  eleventyConfig.addFilter("enhancePostHtml", (html, data) => enhancePostHtml(html, data));
  eleventyConfig.addFilter("renderSummary", (rawBody, data) => renderMarkdown(getSummarySource(rawBody || data?.rawBody || "")));
  eleventyConfig.addFilter("firstImageUrl", (rawBody, data) => getFirstImageUrl(rawBody, data));
  eleventyConfig.addFilter("plainText", (html) => htmlToText(html));
  eleventyConfig.addFilter("normalizeDomain", (value) => normalizeDomain(value));
  eleventyConfig.addFilter("startsWith", (value, prefix) => String(value || "").startsWith(prefix));
  eleventyConfig.addFilter("endsWith", (value, suffix) => String(value || "").endsWith(suffix));
  eleventyConfig.addFilter("limit", (value, count) => Array.isArray(value) ? value.slice(0, count) : value);

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "build"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk"
  };
};
