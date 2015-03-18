#Utility replaces all tabs in the source files
#Usage: ruby replace_tabs.rb /home/anton/github_workspace/jfunk/src java

require 'find'

$source_file_default_ext = "java"
$tab_default_replacement = " " * 4

def replace_tabs(dir, ext, replacement)
  Find.find(dir) do |file_path| 
    if !File.directory?(file_path) && File.extname(file_path).eql?(".#{ext}")
	content = File.read(file_path).gsub(/\t/, replacement)
	File.open(file_path, 'w') do |new_content|
	     new_content << content
	end
    end
  end
end

replace_tabs(ARGV[0] || ".", ARGV[1] || $source_file_ext, ARGV[2] || $tab_default_replacement)