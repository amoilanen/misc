from db import Database

class DataTransform:

    def __init__(self, db):
        self._db = db

    def run(self):
        pass

class UpdateDataTransform(DataTransform):

    def __init__(self, db, updateStatement):
        DataTransform.__init__(self, db)
        self._db = db
        self._updateStatement = updateStatement

    def run(self):
        self._db.execute(self._updateStatement)

db = Database()
db.connect()

transforms = []

#Make sure that countries are named consistently
country_aliases = [
  ['Deutschland', 'Germany'],
  ['Duitsland', 'Germany'],
  ['Saksa', 'Germany'],
  ['Sverige', 'Sweden'],
  ['Suomi', 'Finland'],
  ['Nederland', 'Netherlands'],
  ['Schweiz', 'Switzerland'],
  ['Suisse', 'Switzerland'],
  ['Svizzera', 'Switzerland'],
  ['Belgique', 'Belgium'],
  ['&#214;sterreich', 'Austria'],
  ['Polska', 'Poland'],
  ['VerenigdeArabischeEmiraten', 'UnitedArabEmirates'],
  ['PA;Moorestown', 'PA'],
  ['Danmark', 'Denmark'],
  ['KingdomofNorway', 'Norway'],
  ['VerenigdKoninkrijk', 'UK'],
  ['RegnoUnito', 'UK'],
  ['ReinoUnido', 'UK'],
  ['RoyaumeUni', 'UK'],
  ['Espa&#241;a', 'Spain'],
  ['TheNetherlands', 'Netherlands']
]

for country_alias in country_aliases:
    transforms.append(UpdateDataTransform(db, '''
        update opening
        set country = '%s'
        where country = '%s';
    ''' % (country_alias[1], country_alias[0])))

for transform in transforms:
    transform.run()

db.close()