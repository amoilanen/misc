# Automatically fetches menus for today, grades predefined cafes and based on
# additional information (weather, cafe of choice yesterday) gives recommendations
# where to go for lunch.

from chief_lunch_officer import ChiefLunchOfficer
from constants import TEMPERATURE, PRECIPITATION_CHANCE, PRECIPITATION_AMOUNT, WIND
from constants import NEPALESE, CHINESE, HIMA_SALI, DYLAN_MILK

from pathlib import Path
from datetime import date, datetime, timedelta
import urllib.request
import json
import re

HIMA_SALI_URL = 'http://www.himasali.com/p/lounaslista.html'
DYLAN_MILK_URL = 'http://dylan.fi/milk/'
YLE_WEATHER_FORECAST_URL = 'http://yle.fi/saa/resources/ajax/saa-api/hourly-forecast.action?id=642554'

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
    return find_menu(HIMA_SALI_URL, date, r'%s<br />\n(.*?)\n<br />' % (date_label), -1)

def get_dylan_milk_menu(date):
    return find_menu(DYLAN_MILK_URL, date, r'BUFFET:<br />(.*?)<br /> <br />')

def parse_weather_value(regex, html):
    value = re.findall(regex, html, re.MULTILINE | re.DOTALL)[0]
    return int(value.replace('&lt;', ''))

def get_todays_weather():
    forecast = json.loads(get(YLE_WEATHER_FORECAST_URL))['weatherInfos'][0]
    return {
        TEMPERATURE: forecast['temperature'],
        PRECIPITATION_CHANCE: forecast['probabilityPrecipitation'],
        PRECIPITATION_AMOUNT: forecast['precipitation1h'],
        WIND: forecast['windSpeedMs']
    }

today = date.today()
today = today + timedelta(days=2)

hima_sali_menu = 'meatballs'
dylan_milk_menu = 'fish'
weather = {
    TEMPERATURE: 2,
    PRECIPITATION_CHANCE: 10,
    PRECIPITATION_AMOUNT: 2.0,
    WIND: 5
}

print('Today %s\n' % today.strftime('%d.%m.%y'))

#hima_sali_menu = get_hima_sali_menu(today)
print('\nHima & Sali:\n\n%s' % hima_sali_menu.replace('<br />', '').replace('&amp;', '&').replace('&nbsp;', ''))
#dylan_milk_menu = get_dylan_milk_menu(today)
print('\nDylan Milk:\n\n%s' % dylan_milk_menu.replace('<br />', '\n'))

#weather = get_todays_weather()
print('\nWeather:\n\n temperature %s C\n chance of precipitation %s percent\n precipitation %s mm\n wind %s m/s' % (weather[TEMPERATURE], weather[PRECIPITATION_CHANCE], weather[PRECIPITATION_AMOUNT], weather[WIND]))

def week_number(date):
    return date.isocalendar()[1]

def parse_date(date_str):
    return datetime.strptime(date_str, '%d.%m.%Y')

def get_current_week_lunch_history(today):
    history_path = Path('history.json')
    if not history_path.exists():
        with history_path.open('w') as f:
            f.write('{}')

    history = ''
    with history_path.open('r') as f:
        history = json.loads(f.read())

    history = {
        '14.01.2015': NEPALESE,
        '15.01.2015': HIMA_SALI,
        '19.01.2015': NEPALESE,
        '20.01.2015': CHINESE
    }

    current_week = week_number(today)
    current_week_history = {(k, v) for (k, v) in history.items() if current_week == week_number(parse_date(k))}

    current_week_cafes = list(current_week_history)
    current_week_cafes.sort(key=lambda t: t[0]) # Sort by date
    return list(map(lambda t: t[1], current_week_cafes)) # List of cafe names

lunch_history = get_current_week_lunch_history(today)
print('\nLunch history for current week:\n\n %s' % ', '.join(lunch_history))

cafe_menus = {
    NEPALESE: '',
    CHINESE: '',
    HIMA_SALI: hima_sali_menu,
    DYLAN_MILK: dylan_milk_menu
}

clo = ChiefLunchOfficer()
clo.history(lunch_history).weather(weather).menus(cafe_menus)
print('\nRecommendation:\n\n %s' % clo.decide())