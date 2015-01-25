import unittest
from unittest.mock import Mock

from constants import TEMPERATURE, PRECIPITATION_CHANCE, PRECIPITATION_AMOUNT, WIND
from chief_lunch_officer import ChiefLunchOfficer, WeatherOpinion, FoodTaste

class FoodTasteTest(unittest.TestCase):

    def setUp(self):
        self.food_taste = FoodTaste()
        self.food_taste.preferences({
            'item1': 1,
            'item2': 2,
            'item3': 3,
            'item4': 4,
            'item5': 5
        })

    def test_unknown_food_one_item_menu(self):
        self.assertEqual(0, self.food_taste.rate('unknown_item'))

    def test_known_food_one_item_menu(self):
        self.assertEqual(3, self.food_taste.rate('item3'))

    def test_composite_menu_some_parts_unknown(self):
        self.assertEqual(7, self.food_taste.rate('item3 item4 then also something else'))

    def test_composite_menu_all_parts_unknown(self):
        self.assertEqual(9, self.food_taste.rate('item3 item4 item2'))

class WeatherOpinionTest(unittest.TestCase):

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

class ChiefLunchOfficerTest(unittest.TestCase):

    def setUp(self):
        self.taste = FoodTaste().preferences({})
        self.clo = ChiefLunchOfficer(food_taste=self.taste)

    def test_if_only_one_cafe_to_choose_from_it_is_chosen(self):
        self.clo.cafes({
          'cafe1': {
            'menu': 'food'
          }
        })
        self.assertEqual('cafe1', self.clo.decide_one())

    def test_if_all_same_but_one_cafe_has_better_rating_it_is_chosen(self):

        def rate(menu):
            ratings = {
                'food1': 2,
                'food2': 3,
                'food3': 1
            }
            return ratings[menu]

        self.taste.rate = Mock(side_effect=rate)
        self.clo.cafes({
          'cafe1': {
            'menu': 'food1'
          },
          'cafe2': {
            'menu': 'food2'
          },
          'cafe3': {
            'menu': 'food3'
          }
        })
        self.assertEqual(['cafe2', 'cafe1', 'cafe3'], self.clo.decide())

    #TODO: When weather is bad the cafe with smaller distance is chosen
    #TODO: Occurrences of some cafe in history => prefer other cafe
    #TODO: No weather information provided
    #TODO: No cafes provided
    #TODO: No history provided

#TODO: If one cafe one day then likely another one next day
#TODO: Cafe without a menu no more than once per week

#TODO: If meatballs, likely go there
#TODO: If pea soup, likely go there
#TODO: Prefer meat: pork, meat, beef, hamburger
#TODO: Chicken is also OK but worse: chicken, broiler
#TODO: Fish is sort of OK, but worse than chicken: fish, tuna

#TODO: If bad weather (strong wind or high probability of rain) then Hima & Sali

#TODO: If Wednesday or Friday the possibility of Nepalese is greater:
# add the ability to specify preferrable weekdays for a cafe

#TODO: No menu means no way to go to that cafe (holiday)