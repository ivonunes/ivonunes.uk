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
end
