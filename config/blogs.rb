activate :blog do |blog|
  blog.name = "blog"
  blog.prefix = ""
  blog.permalink = "{year}/{month}/{day}/{title}/index.html"
  blog.sources = "posts/blog/{year}-{month}-{day}-{title}.html"
  blog.layout = "post"
  blog.default_extension = ".md"
  blog.publish_future_dated = true
  blog.paginate = true
  blog.per_page = 5
  blog.page_link = "page/{num}"
  blog.summary_separator = /<!--more-->/
end

activate :blog, name: "photos" do |blog|
  blog.prefix = ""
  blog.permalink = "{year}/{month}/{day}/{title}/index.html"
  blog.sources = "posts/photos/{year}-{month}-{day}-{title}.html"
  blog.layout = "post"
  blog.default_extension = ".md"
  blog.publish_future_dated = true
  blog.paginate = false
  blog.summary_separator = /<!--more-->/
end
