# 'Chief Lunch Officer' - encapsulates the algorithm for choosing an appropriate
# cafe for lunch based on the provided menus, current weather and history of the
# cafe visits for the current week.

from constants import TEMPERATURE, PRECIPITATION_CHANCE, PRECIPITATION_AMOUNT, WIND
from constants import NEPALESE, CHINESE, HIMA_SALI, DYLAN_MILK

class ChiefLunchOfficer:

    def __init__(self):
        self._history = []
        self._weather = {}
        self._menus = []

    def history(self, history):
        self._history = history
        return self

    def weather(self, weather):
        self._weather = weather
        return self

    def menus(self, menus):
        self._menus = menus
        return self

    def decide(self):
        return HIMA_SALI