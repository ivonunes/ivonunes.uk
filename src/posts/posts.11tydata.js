const { getRawBody, inferPermalink, isPhotoPost, getPostName, getIndexExcerpt, hasIndexExcerptMore, getSyndicationUrls } = require("../../utils/site");

module.exports = {
  layout: "post.njk",
  tags: ["posts"],
  eleventyComputed: {
    permalink: (data) => inferPermalink(data),
    rawBody: (data) => getRawBody(data.page.inputPath),
    isPhotoPost: (data) => isPhotoPost(data.rawBody),
    postName: (data) => getPostName(data.title, data.rawBody),
    indexExcerpt: (data) => getIndexExcerpt(data.rawBody, data),
    indexHasMore: (data) => hasIndexExcerptMore(data.rawBody, data),
    syndicationUrls: (data) => getSyndicationUrls(data),
    prevPost: (data) => {
      const idx = data.collections.posts.findIndex(p => p.url === data.page.url);
      return idx >= 0 && idx < data.collections.posts.length - 1 ? data.collections.posts[idx + 1] : null;
    },
    nextPost: (data) => {
      const idx = data.collections.posts.findIndex(p => p.url === data.page.url);
      return idx > 0 ? data.collections.posts[idx - 1] : null;
    }
  }
};
