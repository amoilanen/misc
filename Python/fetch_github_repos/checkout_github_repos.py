#!/usr/bin/env python3
"""
Fetch all GitHub repositories (public and private) for an account and clone
them using ssh://git@github.com/... remotes.
"""

import os
import subprocess
import sys

import click
import requests


API_ROOT = "https://api.github.com"
PER_PAGE = 100


def api_headers(token):
    return {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "checkout-github-repos",
    }


def fetch_all_repos(username, token):
    """Fetch every repo the token can see for `username`.

    When the token belongs to `username`, use /user/repos so private repos
    are included. Otherwise fall back to the public /users/<name>/repos.
    """
    headers = api_headers(token)
    me = requests.get(f"{API_ROOT}/user", headers=headers)
    me.raise_for_status()
    is_self = me.json().get("login", "").lower() == username.lower()

    repos = []
    page = 1
    while True:
        if is_self:
            url = f"{API_ROOT}/user/repos"
            params = {
                "per_page": PER_PAGE,
                "page": page,
                "affiliation": "owner",
                "visibility": "all",
            }
        else:
            url = f"{API_ROOT}/users/{username}/repos"
            params = {"per_page": PER_PAGE, "page": page, "type": "all"}

        resp = requests.get(url, headers=headers, params=params)
        resp.raise_for_status()
        batch = resp.json()
        if not batch:
            break
        repos.extend(batch)
        if len(batch) < PER_PAGE:
            break
        page += 1

    return [r for r in repos if r["owner"]["login"].lower() == username.lower()]


def ssh_remote(repo):
    """Convert GitHub's git@host:owner/name.git into ssh://git@host/owner/name.git."""
    scp = repo["ssh_url"]
    host, path = scp.split("@", 1)[1].split(":", 1)
    return f"ssh://git@{host}/{path}"


def clone(repo, target_dir):
    name = repo["name"]
    remote = ssh_remote(repo)
    dest = os.path.join(target_dir, name)
    tag = "[private]" if repo.get("private") else "[public]"

    if os.path.exists(dest):
        click.echo(f"  skip  {tag} {name} (already exists)")
        return "skipped"

    click.echo(f"  clone {tag} {name} <- {remote}")
    env = os.environ.copy()
    env.setdefault("GIT_SSH_COMMAND", "ssh -o StrictHostKeyChecking=accept-new")
    result = subprocess.run(
        ["git", "clone", remote, dest],
        env=env,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        click.echo(f"  FAIL  {name}: {result.stderr.strip()}", err=True)
        return "failed"
    return "cloned"


@click.command()
@click.option(
    "--username",
    "-u",
    required=True,
    help="GitHub username whose repositories should be cloned.",
)
@click.option(
    "--token",
    "-t",
    required=True,
    envvar="GITHUB_TOKEN",
    help="GitHub personal access token (or set GITHUB_TOKEN).",
)
@click.option(
    "--output-dir",
    "-o",
    default=".",
    type=click.Path(file_okay=False),
    help="Directory to clone repositories into (default: current directory).",
)
def main(username, token, output_dir):
    """Clone every repo (public and private) owned by USERNAME via ssh://git@ remotes."""
    os.makedirs(output_dir, exist_ok=True)

    try:
        repos = fetch_all_repos(username, token)
    except requests.HTTPError as e:
        click.echo(f"GitHub API error: {e} — {e.response.text}", err=True)
        sys.exit(1)

    click.echo(f"Found {len(repos)} repositories for {username}")
    tally = {"cloned": 0, "skipped": 0, "failed": 0}
    for repo in repos:
        tally[clone(repo, output_dir)] += 1

    click.echo(
        f"Done. cloned={tally['cloned']} "
        f"skipped={tally['skipped']} failed={tally['failed']}"
    )
    sys.exit(0 if tally["failed"] == 0 else 1)


if __name__ == "__main__":
    main()
