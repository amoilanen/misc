# Automatically fetches menus for today, grades predefined cafes and based on
# additional information (weather, cafe of choice yesterday) gives recommendations
# where to go for lunch.
# If there are problems with encoding set Python encoding correctly by executing:
# set PYTHONIOENCODING=utf-8

from chief_lunch_officer import ChiefLunchOfficer, WeatherOpinion, FoodTaste
from constants import TEMPERATURE, PRECIPITATION_CHANCE, PRECIPITATION_AMOUNT, WIND
from constants import NEPALESE, HIMA_SALI, DYLAN_MILK, FACTORY_SALMISAARI, PIHKA
from preferences import FOOD_PREFERENCES
from cafes import CAFES

from pathlib import Path
from datetime import date, datetime, timedelta
from copy import deepcopy
import urllib.request
import json
import re

HIMA_SALI_URL = 'http://www.himasali.com/p/lounaslista.html'
DYLAN_MILK_URL = 'http://dylan.fi/milk/'
PIHKA_URL = 'http://ruoholahti.pihka.fi/en/'
FACTORY_SALMISAARI_URL = 'http://www.ravintolafactory.com/ravintolat/helsinki-salmisaari/'
YLE_WEATHER_FORECAST_URL = 'http://yle.fi/saa/resources/ajax/saa-api/hourly-forecast.action?id=642554'

def make_readable(content_with_html_tags, insert_new_lines=True):
    content_with_html_tags = re.sub('<br.*?>', '\n' if insert_new_lines else '', content_with_html_tags)
    content_with_html_tags = re.sub('<.*?>', '', content_with_html_tags)
    content_with_html_tags = re.sub('[ \t]+', ' ', content_with_html_tags)
    content_with_html_tags = re.sub('\n+', '\n', content_with_html_tags)
    content_with_html_tags = content_with_html_tags.replace('&amp;', '&').replace('&nbsp;', '')
    return content_with_html_tags.encode('ascii', 'ignore').decode('ascii')

def get(url):
    response = urllib.request.urlopen(url)
    return response.read().decode(response.headers.get_content_charset())

def get_and_find_all(url, regex):
    html = get(url)
    return re.findall(regex, html, re.MULTILINE | re.DOTALL)

def find_menu(url, date, regex, index=0):
    weekday = date.weekday()
    if (weekday > 4): #Saturday or Sunday
        return 'Weekend: no menu'
    found = get_and_find_all(url, regex)
    if (len(found) == 0):
        return 'No menu'
    else:
        return found[index]

def get_hima_sali_menu(date):
    date_label = '%d\\.%d\\.' % (date.day, date.month)
    return find_menu(HIMA_SALI_URL, date, r'%s(.*?Wok.*?[\d\.]+)' % (date_label), -1)

def get_dylan_milk_menu(date):
    return find_menu(DYLAN_MILK_URL, date, r'<div class="fbf_desc">(.*?)</div>')

def get_pihka_menu(date):
    weekday = date.weekday()
    found = get_and_find_all(PIHKA_URL, r'<div class="menu\-day.*?<ul>(.*?)</div>')
    return found[weekday]

def get_factory_salmisaari_menu(date):
    date_label = '%d\\.%d\\.%d' % (date.day, date.month, date.year)
    found = get_and_find_all(FACTORY_SALMISAARI_URL, r'%s</h3>(.*?)</p>' % (date_label))
    return found[0]

def get_todays_weather():
    weather_response = get(YLE_WEATHER_FORECAST_URL)
    forecast = json.loads(weather_response)['weatherInfos'][0]
    return {
        TEMPERATURE: forecast['temperature'],
        PRECIPITATION_CHANCE: forecast['probabilityPrecipitation'],
        PRECIPITATION_AMOUNT: forecast['precipitation1h'],
        WIND: forecast['windSpeedMs']
    }

def week_number(date):
    return date.isocalendar()[1]

def parse_date(date_str):
    return datetime.strptime(date_str, '%d.%m.%Y')

def get_current_week_history(today):
    history_path = Path('history.json')
    if not history_path.exists():
        with history_path.open('w') as f:
            f.write('{}')
    with history_path.open('r') as f:
        history = json.loads(f.read())
    current_week = week_number(today)

    def is_date_this_week_before_today(d):
        return (current_week == week_number(d)
                and d.date() < today)

    current_week_history = {(k, v) for (k, v) in history.items() if is_date_this_week_before_today(parse_date(k))}
    return dict(current_week_history)

def ordered_cafes(history):
    sorted_dates = sorted(history)
    cafes = []
    for cafe_date in sorted_dates:
        cafes.append(history[cafe_date])
    return cafes

def store_history(history):
    history_path = Path('history.json')
    with history_path.open('w') as f:
        f.write(json.dumps(history, sort_keys=True))

def update_history(history, today, todays_cafe):
    history[today.strftime('%d.%m.%Y')] = todays_cafe
    store_history(history)

today = date.today()
#today = today + timedelta(days=2)
print('Today %s\n' % today.strftime('%d.%m.%Y'))

hima_sali_menu = get_hima_sali_menu(today)
print('\nHima & Sali:\n\n%s' % make_readable(hima_sali_menu, insert_new_lines=False))
dylan_milk_menu = get_dylan_milk_menu(today)
print('\nDylan Milk:\n\n%s' % make_readable(dylan_milk_menu))
pihka_menu = get_pihka_menu(today)
print('\nPihka:\n\n%s' % make_readable(pihka_menu, insert_new_lines=False))
factory_salmisaari_menu = get_factory_salmisaari_menu(today)
print('\nFactory Salmisaari:\n\n%s' % make_readable(factory_salmisaari_menu, insert_new_lines=False))

weather = get_todays_weather()
print('\nWeather:\n\n temperature %s C\n chance of precipitation %s percent\n precipitation amount %s mm\n wind %s m/s' % (weather[TEMPERATURE], weather[PRECIPITATION_CHANCE], weather[PRECIPITATION_AMOUNT], weather[WIND]))

lunch_history = get_current_week_history(today)
current_week_cafes = ordered_cafes(lunch_history)
print('\nLunch history for current week:\n\n %s' % ', '.join(current_week_cafes))

cafes = deepcopy(CAFES)
cafes[HIMA_SALI]['menu'] = hima_sali_menu
cafes[DYLAN_MILK]['menu'] = dylan_milk_menu
cafes[PIHKA]['menu'] = pihka_menu
cafes[FACTORY_SALMISAARI]['menu'] = factory_salmisaari_menu

food_taste = FoodTaste().preferences(FOOD_PREFERENCES)
weather_opinion = WeatherOpinion().weather(weather)
clo = ChiefLunchOfficer(food_taste=food_taste, weather_opinion=weather_opinion)
clo.lunched(current_week_cafes).weather(weather).cafes(cafes).weekday(today.weekday())
todays_cafes = clo.decide()
todays_cafe = todays_cafes[0]
update_history(lunch_history, today, todays_cafe)
print('\nRecommendation:\n\n %s' % todays_cafe)
print('\nAll lunch in preferred order: %s' % ', '.join(todays_cafes))