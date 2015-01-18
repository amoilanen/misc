# Automatically fetches menus for today, grades predefined cafes and based on
# additional information (weather, cafe of choice yesterday) gives recommendations
# where to go for lunch.

from chief_lunch_officer import ChiefLunchOfficer
from constants import TEMPERATURE, PRECIPITATION_CHANCE, PRECIPITATION_AMOUNT, WIND
from constants import NEPALESE, CHINESE, HIMA_SALI, DYLAN_MILK

from datetime import date, timedelta
import urllib.request
import re

HIMA_SALI_URL = 'http://www.himasali.com/p/lounaslista.html'
DYLAN_MILK_URL = 'http://dylan.fi/milk/'
YLE_WEATHER_URL = 'http://yle.fi/saa/suomi/helsinki/pasila/'

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

WEATHER_REGEXES = {
    'TEMPERATURE': '"temperature-container".*?class="value">(.*?)</span>',
    'PRECIPITATION_CHANCE': '"precipitation-container".*?class="value">(.*?)</span>',
    'PRECIPITATION_AMOUNT': 'precipitation-1h".*?(\d+)\.\d* mm',
    'WIND': 'wind-icon.*?class="value">(.*?)</span>'
}

def get_todays_weather():
    html = get(YLE_WEATHER_URL)
    return {
        TEMPERATURE: parse_weather_value(WEATHER_REGEXES['TEMPERATURE'], html),
        PRECIPITATION_CHANCE: parse_weather_value(WEATHER_REGEXES['PRECIPITATION_CHANCE'], html),
        PRECIPITATION_AMOUNT: parse_weather_value(WEATHER_REGEXES['PRECIPITATION_AMOUNT'], html),
        WIND: parse_weather_value(WEATHER_REGEXES['WIND'], html)
    }

today = date.today()
today = today + timedelta(days=2)

print('Today %s\n' % today.strftime('%d.%m.%y'))

hima_sali_menu = get_hima_sali_menu(today)
print('\nHima & Sali:\n\n%s' % hima_sali_menu.replace('<br />', '').replace('&amp;', '&').replace('&nbsp;', ''))

dylan_milk_menu = get_dylan_milk_menu(today)
print('\nDylan Milk:\n\n%s' % dylan_milk_menu.replace('<br />', '\n'))

weather = get_todays_weather()
print('\nWeather:\n\n temperature %s C\n chance of precipitation %s percent\n precipitation %s mm\n wind %s m/s' % tuple(weather.values()))

#hima_sali_menu = 'meatballs'
#dylan_milk_menu = 'fish'
#weather = {
#    TEMPERATURE: 2,
#    PRECIPITATION_CHANCE: 10,
#    PRECIPITATION_AMOUNT: 2,
#    WIND: 5
#}

#TODO: Read from the local file where previous lunches for the current week are stored
lunch_history = [HIMA_SALI, DYLAN_MILK]

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