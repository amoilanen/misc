import unittest

from constants import TEMPERATURE, PRECIPITATION_CHANCE, PRECIPITATION_AMOUNT, WIND
from constants import NEPALESE, HIMA_SALI, DYLAN_MILK
from chief_lunch_officer import ChiefLunchOfficer, WeatherOpinion, FoodTaste
from preferences import FOOD_PREFERENCES
from cafes import CAFES
import copy

class ChiefLunchOfficerIntegrationTest(unittest.TestCase):

    BAD_WEATHER = {
        TEMPERATURE: -30,
        PRECIPITATION_CHANCE: 10,
        PRECIPITATION_AMOUNT: 2.0,
        WIND: 10
    }

    GOOD_WEATHER = {
        TEMPERATURE: 23,
        PRECIPITATION_CHANCE: 0,
        PRECIPITATION_AMOUNT: 0.0,
        WIND: 5
    }

    def setUp(self):
        self.cafes = copy.deepcopy(CAFES)
        self.taste = FoodTaste().preferences(FOOD_PREFERENCES)
        self.weather_opinion = WeatherOpinion().weather(self.GOOD_WEATHER)
        self.clo = ChiefLunchOfficer(food_taste=self.taste, weather_opinion=self.weather_opinion)
        self.clo.cafes(self.cafes)

    def test_if_bad_weather_go_to_hima_sali(self):
        self.cafes[HIMA_SALI]['menu'] = 'green salad'
        self.cafes[DYLAN_MILK]['menu'] = 'meatballs'
        self.weather_opinion.weather(self.BAD_WEATHER)
        self.assertEqual(HIMA_SALI, self.clo.decide_one())

    def test_if_one_cafe_one_day_another_next_day(self):
        self.cafes[HIMA_SALI]['menu'] = 'meatballs'
        self.cafes[DYLAN_MILK]['menu'] = 'meat'
        self.clo.lunched([HIMA_SALI])
        self.assertEqual(DYLAN_MILK, self.clo.decide_one())

    def test_if_meatballs_hima_sali_can_occur_twice_in_a_week(self):
        self.cafes[HIMA_SALI]['menu'] = 'meatballs'
        self.cafes[DYLAN_MILK]['menu'] = 'fish'
        self.clo.lunched([HIMA_SALI])
        self.assertEqual(HIMA_SALI, self.clo.decide_one())

    def test_if_meatballs_hima_sali_can_occur_three_times_in_a_week(self):
        self.cafes[HIMA_SALI]['menu'] = 'meatballs'
        self.cafes[DYLAN_MILK]['menu'] = 'green salad'
        self.clo.lunched([HIMA_SALI, HIMA_SALI])
        self.assertEqual(HIMA_SALI, self.clo.decide_one())

    def test_even_if_meatballs_hima_sali_cannot_occur_four_times_in_a_week(self):
        self.cafes[HIMA_SALI]['menu'] = 'meatballs'
        self.cafes[DYLAN_MILK]['menu'] = 'fish'
        self.clo.lunched([HIMA_SALI, HIMA_SALI, HIMA_SALI])
        self.assertEqual(DYLAN_MILK, self.clo.decide_one())

    def test_if_already_visited_nepalese_this_week_then_some_another_cafe(self):
        self.clo.lunched([NEPALESE])
        self.assertTrue(NEPALESE not in self.clo.decide())

    def test_if_wed_and_nothing_interesting_on_others_menu_then_nepalese_if_not_visited_it(self):
        self.cafes[HIMA_SALI]['menu'] = 'fish'
        self.cafes[DYLAN_MILK]['menu'] = 'fish'
        self.clo.weekday(2)
        self.assertEqual(NEPALESE, self.clo.decide_one())

    def test_if_wed_and_nothing_interesting_on_others_menu_and_bad_weather_then_hima_sali(self):
        self.cafes[HIMA_SALI]['menu'] = 'fish'
        self.cafes[DYLAN_MILK]['menu'] = 'fish'
        self.clo.weekday(2)
        self.weather_opinion.weather(self.BAD_WEATHER)
        self.assertEqual(HIMA_SALI, self.clo.decide_one())

    def test_if_wed_and_nothing_interesting_on_others_menu_then_nepalese_if_not_visited_it(self):
        self.cafes[HIMA_SALI]['menu'] = 'fish'
        self.cafes[DYLAN_MILK]['menu'] = 'fish'
        self.clo.weekday(4)
        self.assertEqual(NEPALESE, self.clo.decide_one())

    def test_if_thu_then_hima_sali_even_if_lunched_2_times_there_this_week(self):
        self.cafes[HIMA_SALI]['menu'] = 'pea soup'
        self.cafes[DYLAN_MILK]['menu'] = 'fish'
        self.clo.weekday(3)
        self.clo.lunched([HIMA_SALI, HIMA_SALI])
        self.assertEqual(HIMA_SALI, self.clo.decide_one())

    def test_if_thu_then_not_hima_sali_if_lunched_3_times_there_this_week(self):
        self.cafes[HIMA_SALI]['menu'] = 'pea soup'
        self.cafes[DYLAN_MILK]['menu'] = 'fish'
        self.clo.weekday(3)
        self.clo.lunched([HIMA_SALI, HIMA_SALI, HIMA_SALI])
        self.assertEqual(DYLAN_MILK, self.clo.decide_one())

    def test_prefer_pea_soup_over_meatballs(self):
        self.cafes[HIMA_SALI]['menu'] = 'meatballs'
        self.cafes[DYLAN_MILK]['menu'] = 'pea soup'
        self.assertEqual(DYLAN_MILK, self.clo.decide_one())

    def test_prefer_meatballs_over_meat(self):
        self.cafes[HIMA_SALI]['menu'] = 'meatballs'
        self.cafes[DYLAN_MILK]['menu'] = 'meat'
        self.assertEqual(HIMA_SALI, self.clo.decide_one())

    def test_prefer_meat_over_chicken(self):
        self.cafes[HIMA_SALI]['menu'] = 'chicken'
        self.cafes[DYLAN_MILK]['menu'] = 'meat'
        self.assertEqual(DYLAN_MILK, self.clo.decide_one())

    def test_prefer_chicken_over_fish(self):
        self.cafes[HIMA_SALI]['menu'] = 'chicken'
        self.cafes[DYLAN_MILK]['menu'] = 'fish'
        self.assertEqual(HIMA_SALI, self.clo.decide_one())

    def test_prefer_fish_over_everything_remaining(self):
        self.cafes[HIMA_SALI]['menu'] = 'brocolli'
        self.cafes[DYLAN_MILK]['menu'] = 'fish'
        self.assertEqual(DYLAN_MILK, self.clo.decide_one())