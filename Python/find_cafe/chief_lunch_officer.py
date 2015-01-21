# 'Chief Lunch Officer' - encapsulates the algorithm for choosing an appropriate
# cafe for lunch based on the provided menus, current weather and history of the
# cafe visits for the current week.

from constants import TEMPERATURE, PRECIPITATION_CHANCE, PRECIPITATION_AMOUNT, WIND
from constants import NEPALESE, CHINESE, HIMA_SALI, DYLAN_MILK

class ChiefLunchOfficer(object):

    def __init__(self):
        self._history = []
        self._weather = {}
        self._cafes = []

    def lunched(self, lunched):
        self._lunched = lunched
        return self

    def weather(self, weather):
        self._weather = weather
        return self

    def cafes(self, cafes):
        self._cafes = cafes
        return self

    def decide(self):
        return list(self._cafes.keys())[0] if len(self._cafes.keys()) > 0 else 'No idea'