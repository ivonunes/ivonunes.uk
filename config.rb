require "time"
require "uri"
require "json"
require "cgi"
require "kramdown-parser-gfm"
require "nokogiri"
require_relative "lib/site_helpers"
require_relative "lib/import_map_loader"

set :markdown_engine, :kramdown
set :markdown, input: "GFM", hard_wrap: false, smartypants: true

set :source, "app"
set :css_dir, "assets/stylesheets"
set :js_dir, "javascript"
set :images_dir, "assets/images"

activate :directory_indexes

%w[blogs pages].each do |config_file|
  path = File.join(__dir__, "config", "#{config_file}.rb")
  instance_eval File.read(path), path if File.exist?(path)
end

helpers SiteHelpers
