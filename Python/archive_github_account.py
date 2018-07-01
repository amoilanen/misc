#!/usr/local/bin/python

# Linux utility for archiving Github.com repositories for a given account.
#
# Example usage:
#
#  python archive_github_account.py antivanov ~/src/my-src
#

import sys
import os
import json
import urllib.request
from string import Template
import re
import pprint

pp = pprint.PrettyPrinter(indent=4)

repos_url_template = Template("https://api.github.com/users/${github_user}/repos")
git_clone_template = Template("mkdir -p ${clone_dir} && cd ${clone_dir} && git clone ${repo_url} && cd -")
tar_template = Template("tar -zcvf ${archive_file_name} ${clone_dir}")

def read_repos_api_results_page(api_url):
  with urllib.request.urlopen(api_url) as response:
    repos_json = response.read().decode('utf-8')
    repos = json.loads(repos_json)
    repo_urls = [repo["html_url"] for repo in repos]

    link_header = response.info().get('Link')
    next_page_url = re.search(r"<([^;]*?)>; rel=\"next\"", link_header)
    if next_page_url is not None:
      next_page_url = next_page_url.group(1)
    else:
      next_page_url = None
    return (repo_urls, next_page_url)

def get_public_repos(github_user):
  url = repos_url_template.substitute(github_user=github_user)
  repo_urls = []
  has_next_page = True
  while has_next_page:
    (new_repo_urls, next_page_url) = read_repos_api_results_page(url)
    repo_urls = repo_urls + new_repo_urls
    has_next_page = next_page_url is not None
    if has_next_page:
      url = next_page_url
  return repo_urls

def get_user():
  github_user = sys.argv[1]
  return github_user

def get_clone_dir():
  clone_dir = sys.argv[2]
  return clone_dir

def clone_githup_repo(repo_url, clone_dir):
  print("Cloning '%s' to '%s' ..." % (repo_url, clone_dir))
  git_clone_cmd = git_clone_template.substitute(repo_url=repo_url, clone_dir=clone_dir)
  os.system(git_clone_cmd)

def zip_archive_folder(clone_dir, github_user):
  archive_file_name = "github.archive." + github_user + ".tar.gz"
  os.system(tar_template.substitute(archive_file_name=archive_file_name, clone_dir=clone_dir))
  return archive_file_name

# Start of the script

print("Archiving Github.com repositories...")
github_user = get_user()
clone_dir = get_clone_dir()
print("Github.com user = ", github_user)
public_repo_urls = get_public_repos(github_user)
print("Known repos = ")
pp.pprint(public_repo_urls)
print("Total repos number = ", len(public_repo_urls))
for repo_url in public_repo_urls:
  clone_githup_repo(repo_url, clone_dir)
print("Archiving repos...")
archive_file_name = zip_archive_folder(clone_dir, github_user)
print("Done. Repositories are in " + archive_file_name)