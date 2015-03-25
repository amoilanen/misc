from transforms import UpdateDataTransform
from db import Database
from country_aliases_transforms import CountryAliasesTransforms
from missing_country_transforms import MissingCountryTransforms
from city_aliases_transforms import CityAliasesTransforms
from skill_aliases_transforms import SkillAliasesTransforms

db = Database()
db.connect()

transform_batches = [
  CountryAliasesTransforms(db),
  MissingCountryTransforms(db),
  CityAliasesTransforms(db),
  SkillAliasesTransforms(db)
]

for transform_batch in transform_batches:
    for transform in transform_batch.get_transforms():
        transform.run()

db.close()