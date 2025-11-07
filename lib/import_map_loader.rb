class ImportMapDefinition
  attr_reader :imports

  def initialize
    @imports = {}
  end

  def pin(name, to:)
    imports[name] = to
  end
end

module ImportMapLoader
  module_function

  def load(root_path)
    definition = ImportMapDefinition.new
    importmap_path = File.join(root_path, "config", "importmap.rb")
    if File.exist?(importmap_path)
      definition.instance_eval(File.read(importmap_path), importmap_path)
    end
    definition.imports
  end
end
