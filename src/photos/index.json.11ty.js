const { getFirstImageUrl } = require("../../utils/site");

module.exports = class {
  data() {
    return {
      permalink: "/photos/index.json"
    };
  }

  render(data) {
    return JSON.stringify(
      data.collections.photoPosts.map((post) => ({
        url: post.url,
        date: post.date,
        image: getFirstImageUrl(post.data.rawBody, post.data),
        title: post.data.title || post.data.postName
      })),
      null,
      2
    );
  }
};
