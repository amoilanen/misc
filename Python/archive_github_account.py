#!/usr/local/bin/python

# Utility for archiving Github.com repositories for a given account.
#
# Example usage:
#
#  python archive_github_account.py antivanov ~/github.archive
#

import re
import sys
import os
import urllib.request

PUBLIC_REPO_HTML_REGEX = "<li class=\"public source\">.*?<a href=\"(.*?)\">"

def get_public_repos(github_user):
  repositories_url = "https://github.com/" + github_user + "?tab=repositories"
  repositories_html = urllib.request.urlopen(repositories_url).read().decode("utf-8")

  return re.findall(PUBLIC_REPO_HTML_REGEX, repositories_html, re.M|re.DOTALL)

def get_user_and_archive_folder():
  github_user, archive_folder_path = read_command_line_args()
  ensure_exists(archive_folder_path)
  return (github_user, archive_folder_path)

def ensure_exists(folder_path):
  if not os.path.exists(folder_path):
    os.makedirs(folder_path)

def read_command_line_args():
  github_user = sys.argv[1]

  archive_folder = sys.argv[2] if len(sys.argv) >= 3 else "."
  archive_folder_path = os.path.abspath(archive_folder)

  return (github_user, archive_folder_path)

def clone_githup_repo(repo_path, folder_path):
  os.system("git clone https://github.com/" + repo_path + " " + folder_path + repo_path)

def zip_archive_folder(github_user, archive_folder_path):
  archive_file_name = "github.archive." + github_user + ".tar.gz"
  os.system("tar -zcvf " + archive_file_name + " " + archive_folder_path)
  os.rename(archive_file_name, archive_folder_path + "/" + archive_file_name)
  return archive_file_name

# Start of the script

print("Archiving Github.com repositories...")

github_user, archive_folder_path = get_user_and_archive_folder()

print("Github.com user = ", github_user)
print("Archive folder = ", archive_folder_path)

public_repo_relative_pathes = get_public_repos(github_user)

for repo_path in public_repo_relative_pathes:
  clone_githup_repo(repo_path, archive_folder_path)

archive_file_name = zip_archive_folder(github_user, archive_folder_path)

print("Done. Repositories are in " + archive_folder_path + "/" + archive_file_name)