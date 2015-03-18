import urllib.request
import re
import json
import pprint

from skills import predefined_skills
from db import Database

base_url = 'http://careers.stackoverflow.com'
jobs_listing_url = base_url + '/jobs?pg=%d'

def get(url):
    return str(urllib.request.urlopen(url).read())

def normalize_skills(skills):
    return set([re.sub('[\- ]', '.', skill.lower()) for skill in skills])

def process_search_results(url, current_page):
    query_url = url % (current_page)
    print('Querying url = %s' % query_url)
    page = get(query_url)
    openings = re.findall('href="(/jobs/\d+/.*?)"', page)
    skills = normalize_skills(re.findall('class="post-tag job-link".*?>(.*?)</a>', page))
    total_pages = int(re.findall('page \d+ of (\d+)', page)[0])
    return [openings, skills, total_pages]

def normalize_umlauts(s):
    return s.replace('ü', 'u').replace('ä', 'a').replace('å', 'a').replace('ö', 'o')

def read_location(page):
    location = re.findall('class="location">(.*?)<', page)[0]
    location = re.sub('[ \t]', '', location)
    return re.findall('([A-Z&#;\d][&#;\d\w\-]+)(?:,([A-Z&#;\d][&#;\d\w\-]+))?', location)[0]

def read_opening(url, idx, known_skills):
    page = get(url)
    title = re.findall('class="title job-link".*?>(.*?)</a>', page)[0]
    location = read_location(page)
    description = re.findall('<div id="jobdetail-nav">(.*?)<div id="footer">', page)[0]
    skills = []
    for idx, skill in enumerate(known_skills):
        if description.find(skill) >= 0:
            skills.append(idx)
    return [title, location, skills]

all_openings = []
all_skills = normalize_skills(predefined_skills)

#TODO: Save and rename the old database file if it already exists
db = Database()
db.connect().create()

current_page = 1
total_pages = 1
while current_page <= total_pages:
    [openings, skills, total_pages] = process_search_results(jobs_listing_url, current_page)
    all_openings = all_openings + openings
    all_skills = all_skills.union(skills)
    current_page = current_page + 1

print('Total pages = ', total_pages)
print('Total openings = %d' % (len(all_openings)))

print('Storing skills...')
all_skills = list(all_skills)
db.store_skills(all_skills)

print('Looking through job openings skills...')
for idx, opening_url in enumerate(all_openings):
    print('Analyzing opening %s of %s in total' % (idx, len(all_openings)))
    print('url = %s' % (opening_url))
    [title, location, skills] = read_opening(base_url + opening_url, 0, all_skills)
    print('title = ', normalize_umlauts(title))
    print('url = ', opening_url)
    print('city = ', normalize_umlauts(location[0]))
    print('country = ', normalize_umlauts(location[1]))
    db.store_opening(opening_id=idx, title=title, url=opening_url, city=location[0], country=location[1], skill_ids=skills)

print('Done')
db.close()