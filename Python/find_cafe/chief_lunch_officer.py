# 'Chief Lunch Officer' - encapsulates the algorithm for choosing an appropriate
# cafe for lunch based on the provided menus, current weather and history of the
# cafe visits for the current week.

from constants import TEMPERATURE, PRECIPITATION_CHANCE, PRECIPITATION_AMOUNT, WIND

class WeatherOpinion:

    MAX_ACCEPTABLE_WIND = 8
    MAX_ACCEPTABLE_TEMPERATURE = 25
    MIN_ACCEPTABLE_TEMPERATURE = -15
    MAX_ACCEPTABLE_PRECIPITATION_CHANCE = 50
    MAX_ACCEPTABLE_PRECIPITATION_AMOUNT = 2.0

    def __init__(self):
        self._weather = None

    def weather(self, weather):
        self._weather = weather
        return self

    def is_positive(self):
        return (self._weather[WIND] <= WeatherOpinion.MAX_ACCEPTABLE_WIND and
                self._weather[TEMPERATURE] <= WeatherOpinion.MAX_ACCEPTABLE_TEMPERATURE and
                self._weather[TEMPERATURE] >= WeatherOpinion.MIN_ACCEPTABLE_TEMPERATURE and
                self._weather[PRECIPITATION_CHANCE] <= WeatherOpinion.MAX_ACCEPTABLE_PRECIPITATION_CHANCE and
                self._weather[PRECIPITATION_AMOUNT] <= WeatherOpinion.MAX_ACCEPTABLE_PRECIPITATION_AMOUNT)

class FoodTaste:

    def preferences(self, preferences):
        self._preferences = preferences
        return self

    def rate(self, menu):
        rating = 0
        for menu_item in menu.split():
            rating += self._preferences.get(menu_item, 0)
        return rating

class ChiefLunchOfficer:

    def __init__(self, food_taste):
        self._history = []
        self._weather = {}
        self._cafes = []
        self._food_taste = food_taste

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
        cafe_score = {}
        for cafe in self._cafes:
            cafe_details = self._cafes[cafe]
            menu_rating = self._food_taste.rate(cafe_details['menu'])
            cafe_score[cafe] = menu_rating
        cafe_score = sorted(cafe_score.items(), key=lambda t: t[1], reverse=True)
        return list(map(lambda score: score[0], cafe_score))

    def decide_one(self):
        decision = self.decide()
        return decision[0] if len(decision) > 0 else 'No idea'