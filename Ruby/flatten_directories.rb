# ruby flatten_directories.rb "/home/anton/root_dir"
# Flatten all the child directories in the folder "root_dir"
require 'find'
require 'fileutils'
require 'pathname'

def for_each_child_directory(root_dir)
  return if !block_given?
  old_dir = Dir.pwd
  Dir.chdir root_dir
  Dir.glob("*") do |file_path|
    if File.directory?(file_path)
      yield file_path
    end
  end
  Dir.chdir old_dir
end

def move_all_new_files_from_subdirectories_to(dir)
  Find.find(dir) do |file_path|
    already_exists = File.exist?(File.join(dir, Pathname.new(file_path).basename))
    if !File.directory?(file_path) && !already_exists
      FileUtils.mv(file_path, dir) 
    end
  end
end

def remove_all_subdirectories_in(dir)
  for_each_child_directory(dir) do |dir|
    FileUtils.rm_rf dir
  end
end

def flatten_directory(dir)
  move_all_new_files_from_subdirectories_to(dir)
  remove_all_subdirectories_in(dir)
end

def flatten_child_directories(root_dir)
  for_each_child_directory(root_dir) do |dir|
    flatten_directory dir
  end
end

flatten_child_directories(ARGV[0] || ".")