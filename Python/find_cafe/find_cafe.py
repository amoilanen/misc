# Automatically fetches menus for today, grades predefined cafes and based on
# additional information (weather, cafe of choice yesterday) gives recommendations
# where to go for lunch.

from datetime import date, timedelta
import urllib.request
import re

HIMA_SALI_URL = 'http://www.himasali.com/p/lounaslista.html'
DYLAN_MILK_URL = 'http://dylan.fi/milk/'

#Weather service
#http://yle.fi/saa/suomi/helsinki/pasila/

def get_and_find_all(url, regex):
    response = urllib.request.urlopen(url)
    html = response.read().decode(response.headers.get_content_charset())
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

today = date.today()
#today = today + timedelta(days=2)

print('Today %s\n' % today.strftime('%d.%m.%y'))

hima_sali_menu = get_hima_sali_menu(today)
print('\nHima & Sali:\n\n%s' % hima_sali_menu.replace('<br />', '').replace('&amp;', '&').replace('&nbsp;', ''))
dylan_milk_menu = get_dylan_milk_menu(today)
print('\nDylan Milk:\n\n%s' % dylan_milk_menu.replace('<br />', '\n'))