# Simple RSS feed fetcher.
# Usage:
#    python3 fetch_hyperlinks.py --url http://archive.org/download/MIT18.06S05_MP4/ --save_to_dir=/home/anton/Educational/MIT/18-06-linear-algebra-spring-2010 --ext "mp4,srt,gif"
#
import re
import os
import glob
import click
import time
import math
from datetime import datetime
from urllib.request import urlopen
from urllib.parse import urljoin
from pathlib import Path

READ_BUFFER_SIZE_BYTES = 16384
PROGRESS_BAR_LENGTH = 100
BYTES_IN_MEGABIT = 1024 * 1024 / 8

def show_progress_bar(completed, total, extra_progress_info, bar_length = PROGRESS_BAR_LENGTH):
    if total > 0:
        bar_length_unit_value = (total / bar_length)
        completed_bar_part = math.ceil(completed / bar_length_unit_value)
        progress = "*" * completed_bar_part
        remaining = " " * (bar_length - completed_bar_part)
        percent_done = "%.2f" % ((completed / total) * 100)
        print(f'[{progress}{remaining}] {percent_done}% {extra_progress_info}', end='\r')
    else:
        print(extra_progress_info, end='\r')

def download_url(url, destination_file):
    if (Path(destination_file).is_file()):
        print(f'{destination_file} was already downloaded, skipping...')
        return
    destination_file_part = f'{destination_file}._part'
    open_url = urlopen(url)
    url_info = open_url.info()
    content_length = int(url_info.get('Content-Length', -1))
    print(f'Downloading {url} as {destination_file}, {content_length} bytes...')
    start_time = datetime.now()
    with open(destination_file_part, 'bw') as target:
        read_length = 0
        while True:
            buffer = open_url.read(READ_BUFFER_SIZE_BYTES)
            if not buffer:
                break
            read_length += len(buffer)
            elapsed_time_seconds = (datetime.now() - start_time).seconds
            if elapsed_time_seconds > 0:
                speed_megabit_per_second = read_length / (BYTES_IN_MEGABIT * elapsed_time_seconds)
                formatted_speed = "%.3f" % speed_megabit_per_second
            else:
                formatted_speed = "0.000"
            show_progress_bar(read_length, content_length, f'{formatted_speed} Mb/s')
            target.write(buffer)
    os.rename(destination_file_part, destination_file)
    print('\n')

def ensure_directory_exists(directory):
    if not os.path.exists(directory):
        os.makedirs(directory)

def remove_partial_downloads(directory):
    for partial_download in glob.glob("*._part"):
        os.remove(partial_download)

def extensions_to_regex(extensions):
    extension_groups = [f'(?:{extension})' for extension in extensions.split(',')]
    extension_groups_or = '|'.join(extension_groups)
    return f'(?:{extension_groups_or})'

def get_link_urls(base_url, ext):
    link_html = str(urlopen(base_url).read())
    extensions_regex = extensions_to_regex(ext)
    relative_urls = re.findall(f'href=\"([^\"]*?\.{extensions_regex})\"', link_html)
    return [urljoin(base_url, url) for url in relative_urls]

def download_urls(urls, save_to_dir):
    downloaded_url_count = 0
    total_url_count = len(urls)
    for url in urls:
        short_file_name = url.rpartition('/')[2]
        destination_file = os.path.join(save_to_dir, short_file_name)
        download_url(url, destination_file)
        downloaded_url_count = downloaded_url_count + 1
        print(f'Downloaded {downloaded_url_count} of {total_url_count}')

@click.command()
@click.option('--url', help='Url with links')
@click.option('--save_to_dir', help='Directory to save content to')
@click.option('--ext', help='Link extensions to fetch, comma-separated')
def fetch_links(url, save_to_dir, ext):
    ensure_directory_exists(save_to_dir)
    remove_partial_downloads(save_to_dir)
    print("Reading links...")
    urls = get_link_urls(url, ext)
    print("Fetching links...")
    download_urls(urls, save_to_dir)
    print("Done.")

if __name__ == '__main__':
    fetch_links()