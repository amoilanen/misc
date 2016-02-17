#!/usr/local/bin/python

# Linux utility for archiving Github.com repositories for a given account.
#
# Example usage:
#
#  python archive_github_account.py antivanov
#

import sys
import os
import json
import urllib.request
from string import Template

repos_folder = "github_repos"
repos_url_template = Template("https://api.github.com/users/${github_user}/repos")
git_clone_template = Template("mkdir -p '${repos_folder}' && cd '${repos_folder}' && git clone ${repo_url} && cd..")
tar_template = Template("tar -zcvf '${archive_file_name}' '${repos_folder}'")

def get_public_repos(github_user):
  url = repos_url_template.substitute(github_user=github_user)
  repos_json = urllib.request.urlopen(url).read().decode('utf-8')
  repos = json.loads(repos_json)
  repo_urls = [repo["html_url"] for repo in repos]
  return repo_urls

def get_user():
  github_user = sys.argv[1]
  return github_user

def clone_githup_repo(repo_url):
  print("Cloning '%s' ..." % (repo_url))
  git_clone_cmd = git_clone_template.substitute(repo_url=repo_url, repos_folder=repos_folder)
  os.system(git_clone_cmd)

def zip_archive_folder(github_user):
  archive_file_name = "github.archive." + github_user + ".tar.gz"
  os.system(tar_template.substitute(archive_file_name=archive_file_name, repos_folder=repos_folder))
  return archive_file_name

# Start of the script
print("Archiving Github.com repositories...")
github_user = get_user()
print("Github.com user = ", github_user)
public_repo_urls = get_public_repos(github_user)
print("Known repos = ", public_repo_urls)
for repo_url in public_repo_urls:
  clone_githup_repo(repo_url)
archive_file_name = zip_archive_folder(github_user)
print("Done. Repositories are in " + archive_file_name)