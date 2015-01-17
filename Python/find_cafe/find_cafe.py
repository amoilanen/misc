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

def format_date(d):
    return '%d\\.%d\\.' % (d.day, d.month)

def get_hima_sali_menu(date):
    weekday = date.weekday()
    if (weekday > 4): #Saturday or Sunday
        return 'Weekend: no menu'

    date_label = format_date(date)

    response = urllib.request.urlopen(HIMA_SALI_URL)
    html = response.read().decode(response.headers.get_content_charset())
    dates_menu = re.findall(r'%s<br />\n(.*?)\n<br />' % (date_label), html, re.MULTILINE | re.DOTALL)

    if (len(dates_menu) == 0):
        return 'No menu'
    else:
        return dates_menu[-1]

def get_dylan_milk_menu(date):
    weekday = date.weekday()
    if (weekday > 4): #Saturday or Sunday
        return 'Weekend: no menu'

    response = urllib.request.urlopen(DYLAN_MILK_URL)
    html = response.read().decode(response.headers.get_content_charset())

    dates_menu = re.findall(r'BUFFET:<br />(.*?)<br /> <br />', html, re.MULTILINE | re.DOTALL)
    if (len(dates_menu) == 0):
        return 'No menu'
    else:
        return dates_menu[0]

today = date.today()
#today = today + timedelta(days=2)

print('Today %s\n' % today.strftime('%d.%m.%y'))

hima_sali_menu = get_hima_sali_menu(today)
print('\nHima & Sali:\n\n%s' % hima_sali_menu.replace('<br />', '').replace('&amp;', '&').replace('&nbsp;', ''))
dylan_milk_menu = get_dylan_milk_menu(today)
print('\nDylan Milk:\n\n%s' % dylan_milk_menu.replace('<br />', '\n'))