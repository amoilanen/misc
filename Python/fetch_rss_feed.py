# Simple RSS feed fetcher.
# Usage python3 fetch_rss_feed.py http://feeds.harvardbusiness.org/harvardbusiness/ideacast --save_to_dir=/home/anton/IdeaCast
#
import re
import os
import urllib.request
import argparse

parser = argparse.ArgumentParser()
parser.add_argument("feed_url", help="RSS feed url")
parser.add_argument("--save_to_dir", help="Directory to save episodes to")

args = parser.parse_args()

print("Reading feed...")
feed_xml = str(urllib.request.urlopen(args.feed_url).read())
urls = re.findall("enclosure url=\"(.*?)\"", feed_xml)

print("Fetching episodes...")
for url in urls:
    os.system("wget {url} -P {output_dir}".format(url=url, output_dir=args.save_to_dir))
print("Done.")