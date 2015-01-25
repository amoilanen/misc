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

    def test_empty_menu_rating_is_zero(self):
        self.assertEqual(0, self.food_taste.rate(''))

    def test_repeating_item_on_menu_does_not_change_rating(self):
        self.assertEqual(1, self.food_taste.rate('item1 item1 item1 item1 item1'))

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
        self.weather = WeatherOpinion()
        self.weather.is_positive = Mock(return_value=True)
        self.clo = ChiefLunchOfficer(food_taste=self.taste, weather_opinion=self.weather)

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
                'good_food': 2,
                'excellent_food': 3,
                'some_food': 1
            }
            return ratings[menu]

        self.taste.rate = Mock(side_effect=rate)
        self.clo.cafes({
          'cafe1': {
            'menu': 'good_food',
            'distance': 1
          },
          'cafe2': {
            'menu': 'excellent_food',
            'distance': 1
          },
          'cafe3': {
            'menu': 'some_food',
            'distance': 1
          }
        })
        self.assertEqual(['cafe2', 'cafe1', 'cafe3'], self.clo.decide())

    def test_if_all_same_and_bad_weather_then_cafe_with_shortest_distance_is_chosen(self):
        self.taste.rate = Mock(return_value=0)
        self.weather.is_positive = Mock(return_value=False)
        self.clo.cafes({
          'cafe1': {
            'menu': 'food1',
            'distance': 2
          },
          'cafe2': {
            'menu': 'food2',
            'distance': 3
          },
          'cafe3': {
            'menu': 'food3',
            'distance': 1
          }
        })
        self.assertEqual(['cafe3', 'cafe1', 'cafe2'], self.clo.decide())

    def test_if_all_same_but_history_not_visited_cafe_is_preferred(self):
        self.clo.cafes({
          'cafe1': {
            'menu': 'food1',
            'distance': 1
          },
          'cafe2': {
            'menu': 'food2',
            'distance': 1
          },
          'cafe3': {
            'menu': 'food3',
            'distance': 1
          }
        })
        self.clo.lunched(['cafe2', 'cafe3', 'cafe3', 'cafe1', 'cafe1', 'cafe1'])
        self.assertEqual(['cafe2', 'cafe3', 'cafe1'], self.clo.decide())

    def test_if_all_same_and_some_cafe_preferred_on_this_weekday_choose_this_cafe(self):
        self.clo.weekday(4)
        self.clo.cafes({
          'cafe1': {
            'menu': 'food1',
            'distance': 1,
            'preferred_weekdays': [3]
          },
          'cafe2': {
            'menu': 'food2',
            'distance': 1,
            'preferred_weekdays': [4]
          }
        })
        self.assertEqual(['cafe2', 'cafe1'], self.clo.decide())
        self.clo.cafes({
          'cafe2': {
            'menu': 'food2',
            'distance': 1
          },
          'cafe3': {
            'menu': 'food3',
            'distance': 1,
            'preferred_weekdays': [4]
          }
        })
        self.assertEqual(['cafe3', 'cafe2'], self.clo.decide())

    #TODO: If cafe has holiday days do not go to it on holiday day
    #TODO: No weather information provided
    #TODO: No cafes provided
    #TODO: No history provided
    #TODO: No information provided

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