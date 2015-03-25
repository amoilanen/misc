from transforms import UpdateDataTransform

class CountryAliasesTransforms:

    def __init__(self, _db):
        self._db = _db

    def get_transforms(self):
        transforms = []
        aliases = [
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
            ['TheNetherlands', 'Netherlands'],
            ['&#205;rorsz&#225;g', 'Ireland']
        ]
        for alias in aliases:
            transforms.append(UpdateDataTransform(self._db, '''
                update opening
                set country = '%s'
                where country = '%s';
            ''' % (alias[1], alias[0])))
        return transforms