#!/usr/bin/env python3
"""
GitHub Repository Checkout Script

Clones all repositories (public and private) from a GitHub account using SSH.
"""

import click
import requests
import subprocess
import os
from pathlib import Path


def get_authenticated_user(token):
    """Get the authenticated user's information."""
    headers = {
        'Authorization': f'token {token}',
        'Accept': 'application/vnd.github.v3+json'
    }
    response = requests.get('https://api.github.com/user', headers=headers)
    response.raise_for_status()
    return response.json()


def get_all_repos(username, token):
    """Fetch all repositories for the given username using the access token."""
    headers = {
        'Authorization': f'token {token}',
        'Accept': 'application/vnd.github.v3+json'
    }

    repos = []
    page = 1
    per_page = 100

    while True:
        # Use /user/repos to get all repos the authenticated user has access to
        # This includes private repos if the token has the right scope
        if username:
            url = f'https://api.github.com/users/{username}/repos'
        else:
            url = 'https://api.github.com/user/repos'

        params = {
            'page': page,
            'per_page': per_page,
            'type': 'all',  # Get all repos (public, private, forks)
            'sort': 'updated',
            'direction': 'desc'
        }

        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()

        data = response.json()
        if not data:
            break

        repos.extend(data)
        page += 1

    return repos


def clone_repo(repo_data, output_dir, dry_run=False):
    """Clone a repository using SSH URL."""
    repo_name = repo_data['name']
    ssh_url = repo_data['ssh_url']
    full_name = repo_data['full_name']
    is_private = repo_data['private']

    privacy_marker = "[PRIVATE]" if is_private else "[PUBLIC]"

    target_path = os.path.join(output_dir, repo_name)

    if os.path.exists(target_path):
        click.echo(f"  ⏭️  {privacy_marker} {full_name} - already exists, skipping")
        return False

    if dry_run:
        click.echo(f"  [DRY RUN] Would clone {privacy_marker} {full_name}")
        click.echo(f"            {ssh_url} -> {target_path}")
        return True

    click.echo(f"  📦 Cloning {privacy_marker} {full_name}...")

    try:
        # Set SSH options to automatically accept host keys
        env = os.environ.copy()
        env['GIT_SSH_COMMAND'] = 'ssh -o StrictHostKeyChecking=accept-new'

        subprocess.run(
            ['git', 'clone', ssh_url, target_path],
            check=True,
            capture_output=True,
            text=True,
            env=env
        )
        click.echo(f"  ✓ Successfully cloned {repo_name}")
        return True
    except subprocess.CalledProcessError as e:
        click.echo(f"  ✗ Failed to clone {repo_name}: {e.stderr}", err=True)
        return False


@click.command()
@click.option(
    '--token',
    '-t',
    envvar='GITHUB_TOKEN',
    required=True,
    help='GitHub personal access token (can also use GITHUB_TOKEN env var)'
)
@click.option(
    '--username',
    '-u',
    help='GitHub username (if not provided, uses authenticated user)'
)
@click.option(
    '--output-dir',
    '-o',
    default='.',
    type=click.Path(),
    help='Directory to clone repositories into (default: current directory)'
)
@click.option(
    '--dry-run',
    '-n',
    is_flag=True,
    help='Show what would be cloned without actually cloning'
)
def main(token, username, output_dir, dry_run):
    """
    Clone all GitHub repositories for a given account.

    This script will clone all repositories (public and private) that the
    authenticated user has access to using SSH URLs.

    Examples:

        # Clone all repos for the authenticated user
        ./checkout_github_repos.py --token ghp_xxxxx

        # Clone all repos for a specific user
        ./checkout_github_repos.py --token ghp_xxxxx --username octocat

        # Use environment variable for token
        export GITHUB_TOKEN=ghp_xxxxx
        ./checkout_github_repos.py --username octocat

        # Dry run to see what would be cloned
        ./checkout_github_repos.py --token ghp_xxxxx --dry-run
    """

    click.echo("🚀 GitHub Repository Checkout Tool\n")

    # Create output directory if it doesn't exist
    Path(output_dir).mkdir(parents=True, exist_ok=True)

    try:
        # If no username provided, get the authenticated user
        if not username:
            click.echo("Fetching authenticated user information...")
            user_info = get_authenticated_user(token)
            username = user_info['login']
            click.echo(f"Authenticated as: {username}\n")

        # Fetch all repositories
        click.echo(f"Fetching repositories for {username}...")
        repos = get_all_repos(username, token)

        if not repos:
            click.echo("No repositories found.")
            return

        click.echo(f"Found {len(repos)} repositories\n")

        if dry_run:
            click.echo("=== DRY RUN MODE ===\n")

        # Clone each repository
        cloned = 0
        skipped = 0
        failed = 0

        for repo in repos:
            result = clone_repo(repo, output_dir, dry_run)
            if result:
                cloned += 1
            elif result is False and not os.path.exists(os.path.join(output_dir, repo['name'])):
                failed += 1
            else:
                skipped += 1

        # Summary
        click.echo(f"\n{'='*50}")
        click.echo(f"Summary:")
        if dry_run:
            click.echo(f"  Would clone: {cloned}")
        else:
            click.echo(f"  Successfully cloned: {cloned}")
            click.echo(f"  Failed: {failed}")
        click.echo(f"  Skipped (already exist): {skipped}")
        click.echo(f"  Total repositories: {len(repos)}")

    except requests.exceptions.HTTPError as e:
        click.echo(f"\n✗ GitHub API Error: {e}", err=True)
        if e.response.status_code == 401:
            click.echo("  Check that your access token is valid and has the required scopes.", err=True)
        elif e.response.status_code == 404:
            click.echo(f"  User '{username}' not found.", err=True)
        raise click.Abort()
    except Exception as e:
        click.echo(f"\n✗ Error: {e}", err=True)
        raise click.Abort()


if __name__ == '__main__':
    main()
