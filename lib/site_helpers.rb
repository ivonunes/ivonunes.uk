require 'nokogiri'
require 'cgi'

module SiteHelpers
  def site_data
    data.site
  end

  def full_title
    base_title = site_data.title
    page_title = current_page.data.title

    if page_title && page_title != base_title
      "#{base_title} | #{page_title}"
    else
      base_title
    end
  end

  def canonical_url(resource = current_page)
    path = resource.respond_to?(:url) ? resource.url : resource.to_s
    URI.join(site_data.url, path.to_s).to_s
  end

  def absolute_url(path)
    URI.join(site_data.url, path.to_s).to_s
  end

  def nav_resources
    sitemap.resources
           .select { |res| res.data.menu == "main" }
           .uniq
           .sort_by { |res| res.data.weight || 0 }
  end

  def nav_active?(resource)
    current = current_page
    resource_url = resource.url

    return true if resource_url == "/" && current.url == "/"
    return true if resource_url != "/" && current.url.start_with?(resource_url)

    photos_title = resource.data.title&.downcase
    return true if photos_title == "photos" && (photo_article?(current) || current.data.photo)

    false
  end

  def photo_article?(resource = current_page)
    return false unless resource.respond_to?(:data)

    present_value?(resource.data.photo)
  end

  def resource_translate_value(index)
    "#{index * 100}%"
  end

  def page_description(resource = current_page)
    candidate = resource.data.description ||
                resource.data.summary ||
                resource.data.excerpt ||
                site_data.author&.bio ||
                site_data.title

    normalize_whitespace(candidate)
  end

  def normalize_whitespace(value)
    value.to_s.gsub(/<[^>]*>/, " ").gsub(/\s+/, " ").strip
  end

  def blank_value?(value)
    return true if value.nil?
    return value.empty? if value.respond_to?(:empty?)

    normalize_whitespace(value).empty?
  end

  def present_value?(value)
    !blank_value?(value)
  end

  def truncate_words(text, count)
    cleaned = normalize_whitespace(text)
    words = cleaned.split(/\s+/)
    return cleaned if words.length <= count

    words.first(count).join(' ') + '…'
  end

  def social_link_for(key)
    links = site_data.social || {}
    value = links[key.to_sym] || links[key.to_s]
    value = nil if blank_value?(value)

    return value if value

    return '/feed.xml' if key.to_sym == :rss
  end

  def import_map
    @_import_map ||= ImportMapLoader.load(app.root)
  end

  def rss_author_name
    author_name = site_data.author&.name
    author_name = site_data.title if blank_value?(author_name)
    author_name
  end

  def photo_blog_articles(limit: 25)
    blog_articles_by_type(photo: true, limit: limit)
  end

  def article_blog_articles(limit: 25)
    blog_articles_by_type(photo: false, limit: limit)
  end

  def absolutize_image_sources(html)
    return html if blank_value?(html)

    fragment = Nokogiri::HTML.fragment(html)
    fragment.css('img').each do |img|
      img['src'] = absolute_image_url(img['src']) if img['src']
      img['srcset'] = absolutize_srcset(img['srcset']) if img['srcset']
    end

    fragment.to_html
  end

  def plain_text_without_images(html)
    return "" if blank_value?(html)

    fragment = Nokogiri::HTML.fragment(html)
    fragment.css('img').remove

    text = fragment.children.map { |child| extract_plain_text(child) }.join
    text = text.gsub(/\r\n?/, "\n")
    text = text.lines.map { |line| line.rstrip }.join("\n")
    text = text.gsub(/\n{3,}/, "\n\n").strip
    CGI.unescapeHTML(text)
  end
  alias_method :plain_text_content, :plain_text_without_images

  def xml_escape(value)
    return "" if value.nil?

    value
      .to_s
      .gsub('&', '&amp;')
      .gsub('<', '&lt;')
      .gsub('>', '&gt;')
  end

  private

  def blog_articles_by_type(photo:, limit:)
    posts = blog(:blog).articles.sort_by(&:date).reverse
    posts = if photo
              posts.select { |post| photo_article?(post) }
            else
              posts.reject { |post| photo_article?(post) }
            end
    limit ? posts.first(limit) : posts
  end

  def absolute_image_url(value)
    return value if blank_value?(value)

    absolute_url(value)
  rescue URI::Error
    value
  end

  def absolutize_srcset(srcset)
    return srcset if blank_value?(srcset)

    candidates = srcset.split(',').map do |candidate|
      url, descriptor = candidate.strip.split(/\s+/, 2)
      next candidate if blank_value?(url)

      absolute = absolute_image_url(url)
      descriptor ? "#{absolute} #{descriptor}" : absolute
    end

    candidates.join(', ')
  rescue URI::Error
    srcset
  end

  def extract_plain_text(node)
    case node
    when Nokogiri::XML::Text
      node.text
    when Nokogiri::XML::Element
      return "\n" if node.name == 'br'

      content = node.children.map { |child| extract_plain_text(child) }.join
      stripped = content.strip
      return "" if stripped.empty?

      block_level_element?(node.name) ? "#{stripped}\n\n" : content
    else
      ""
    end
  end

  def block_level_element?(name)
    %w[address article aside blockquote canvas dd div dl dt fieldset figcaption figure footer form h1 h2 h3 h4 h5 h6 header hgroup hr li main nav noscript ol output p pre section table tfoot ul video].include?(name)
  end
end
