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
        if self._weather is None:
            return None
        return (self._weather[WIND] <= WeatherOpinion.MAX_ACCEPTABLE_WIND and
                self._weather[TEMPERATURE] <= WeatherOpinion.MAX_ACCEPTABLE_TEMPERATURE and
                self._weather[TEMPERATURE] >= WeatherOpinion.MIN_ACCEPTABLE_TEMPERATURE and
                self._weather[PRECIPITATION_CHANCE] <= WeatherOpinion.MAX_ACCEPTABLE_PRECIPITATION_CHANCE and
                self._weather[PRECIPITATION_AMOUNT] <= WeatherOpinion.MAX_ACCEPTABLE_PRECIPITATION_AMOUNT)

class FoodTaste:

    def __init__(self):
        self._preferences = None

    def preferences(self, preferences):
        self._preferences = preferences
        return self

    def rate(self, menu):
        menu = menu.lower()
        rating = 0
        if self._preferences is not None:
            for menu_item in self._preferences.keys():
                if menu_item in menu:
                    item_rating = self._preferences.get(menu_item)
                    if item_rating > rating:
                        rating = item_rating
        return rating

class ChiefLunchOfficer:

    MENU_WEIGHT = 1
    WEATHER_WEIGHT = -15
    VISITED_WEIGHT = -3
    PREFERRED_DAY_WEIGHT = 10

    def __init__(self, food_taste, weather_opinion, debug=False):
        self._weekday = None
        self._lunched = {}
        self._weather = {}
        self._cafes = []
        self._food_taste = food_taste
        self._weather_opinion = weather_opinion
        self._debug = debug

    def _log(self, msg):
        if self._debug:
            print('DEBUG: ' + msg)

    def weekday(self, weekday):
        """
        weekday - number of the day of week in the range 0 - 6 (Monday - Sunday)
        """
        self._weekday = weekday

    def lunched(self, lunched):
        self._lunched = {}
        for cafe_name in lunched:
            self._lunched[cafe_name] = self._lunched.get(cafe_name, 0) + 1
        return self

    def weather(self, weather):
        self._weather = weather
        return self

    def cafes(self, cafes):
        self._cafes = cafes
        return self

    def decide(self):
        is_bad_weather = not self._weather_opinion.is_positive()
        cafe_score = {}
        for cafe in self._cafes:
            self._log('%s computing score...' % cafe)
            cafe_details = self._cafes[cafe]
            if ('closed_weekdays' in cafe_details and
                self._weekday in cafe_details['closed_weekdays']):
                self._log('%s is closed today, excluding it' % cafe)
                continue
            if ('once_per_week' in cafe_details and
                cafe in self._lunched):
                self._log('%s is only once per week, already visited, excluding it' % cafe)
                continue
            menu_rating = self.MENU_WEIGHT * self._food_taste.rate(cafe_details['menu'])
            self._log('menu rating = %d' % menu_rating)
            if is_bad_weather:
                weather_score_penalty = self.WEATHER_WEIGHT * cafe_details['distance']
                menu_rating = menu_rating + weather_score_penalty
                self._log('bad weather: + %d' % weather_score_penalty)
            if cafe in self._lunched:
                visited_times = self._lunched.get(cafe, 0)
                visited_score_penalty = self.VISITED_WEIGHT * visited_times
                menu_rating = menu_rating + visited_score_penalty
                self._log('already visited %d times: + %d' % (visited_times, visited_score_penalty))
            if ('preferred_weekdays' in cafe_details and
                self._weekday in cafe_details['preferred_weekdays']):
                menu_rating = menu_rating + self.PREFERRED_DAY_WEIGHT;
                self._log('preferred weekday: + %d' % self.PREFERRED_DAY_WEIGHT)
            self._log('overall score: %d' % menu_rating)
            cafe_score[cafe] = menu_rating
        self._log('Overall cafe scores based on the algorithm:')
        self._log(str(cafe_score))
        cafe_score = sorted(cafe_score.items(), key=lambda t: t[1], reverse=True)
        return list(map(lambda score: score[0], cafe_score))

    def decide_one(self):
        decision = self.decide()
        return decision[0] if len(decision) > 0 else 'No idea'