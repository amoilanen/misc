import unittest

from constants import TEMPERATURE, PRECIPITATION_CHANCE, PRECIPITATION_AMOUNT, WIND
from constants import NEPALESE, CHINESE, HIMA_SALI, DYLAN_MILK
from chief_lunch_officer import ChiefLunchOfficer, WeatherOpinion, FoodTaste
from preferences import FOOD_PREFERENCES
from cafes import CAFES
import copy

class ChiefLunchOfficerTest(unittest.TestCase):

    BAD_WEATHER = {
        TEMPERATURE: -30,
        PRECIPITATION_CHANCE: 10,
        PRECIPITATION_AMOUNT: 2.0,
        WIND: 10
    }

    def setUp(self):
        self.cafes = copy.deepcopy(CAFES)
        self.taste = FoodTaste().preferences(FOOD_PREFERENCES)
        self.weather_opinion = WeatherOpinion()
        self.clo = ChiefLunchOfficer(food_taste=self.taste, weather_opinion=self.weather_opinion)
        self.clo.cafes(self.cafes)

    def test_if_bad_weather_go_to_hima_sali(self):
        self.cafes[HIMA_SALI]['menu'] = 'green salad'
        self.cafes[DYLAN_MILK]['menu'] = 'meatballs'
        self.weather_opinion.weather(self.BAD_WEATHER)
        self.assertEqual(HIMA_SALI, self.clo.decide_one())

#TODO: If one cafe one day then likely another one next day
#TODO: Cafe without a menu no more than once per week

#TODO: If meatballs, likely go there
#TODO: If pea soup, likely go there
#TODO: Prefer meat: pork, meat, beef, hamburger
#TODO: Chicken is also OK but worse: chicken, broiler
#TODO: Fish is sort of OK, but worse than chicken: fish, tuna

#TODO: If Wednesday or Friday the possibility of Nepalese is greater:
# add the ability to specify preferrable weekdays for a cafe

#TODO: No menu means no way to go to that cafe (holiday)