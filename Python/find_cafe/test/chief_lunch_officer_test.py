import unittest

from constants import TEMPERATURE, PRECIPITATION_CHANCE, PRECIPITATION_AMOUNT, WIND
from chief_lunch_officer import ChiefLunchOfficer, WeatherOpinion

class TestChiefLunchOfficer(unittest.TestCase):

    def setUp(self):
        self.clo = ChiefLunchOfficer()

    def test_if_only_one_cafe_to_choose_from_it_is_chosen(self):
        self.clo.cafes({
          'cafe1': {
            'menu': 'food'
          }
        })
        self.assertEqual('cafe1', self.clo.decide())

class TestWeatherOpinion(unittest.TestCase):

    def setUp(self):
        self.opinion = WeatherOpinion()
        self.weather = {
            TEMPERATURE: 10,
            PRECIPITATION_CHANCE: 10,
            PRECIPITATION_AMOUNT: 0.2,
            WIND: 5
        }
        self.opinion.weather(self.weather)

    def test_if_too_strong_wind_weather_is_bad(self):
        self.weather[WIND] = 15
        self.assertFalse(self.opinion.is_positive())

    def test_if_too_cold_weather_is_bad(self):
        self.weather[TEMPERATURE] = -30
        self.assertFalse(self.opinion.is_positive())

    def test_if_too_hot_weather_is_bad(self):
        self.weather[TEMPERATURE] = 30
        self.assertFalse(self.opinion.is_positive())

    def test_if_a_lot_of_precipitation_with_high_chance_weather_is_bad(self):
        self.weather[PRECIPITATION_CHANCE] = 80
        self.weather[PRECIPITATION_AMOUNT] = 2.0
        self.assertFalse(self.opinion.is_positive())

    def test_if_temperature_is_mild_minor_chance_of_minor_precipitation_and_wind_mild(self):
        self.weather[WIND] = 5
        self.weather[TEMPERATURE] = -2
        self.weather[PRECIPITATION_CHANCE] = 10
        self.weather[PRECIPITATION_AMOUNT] = 0.5
        self.assertTrue(self.opinion.is_positive())

#TODO: If one cafe one day then likely another one next day
#TODO: If meatballs, likely go there
#TODO: Prefer meat: pork, meat, beef
#TODO: Chicken is also OK but worse: chicken, broiler
#TODO: Fish is sort of OK, but worse than chicken: fish, tuna
#TODO: If pea soup, likely go there
#TODO: If bad weather (strong wind or high probability of rain) then Hima & Sali
#TODO: If Wednesday or Friday the possibility of Nepalese is greater
#TODO: No menu means no way to go to that cafe (holiday)
#TODO: Nepalese no more than once per week
#TODO: Chinese no more than once per week

#TODO: Store previous choices in the file, empty the file if the last entry is from previous week
#TODO: Support holidays during the current work week