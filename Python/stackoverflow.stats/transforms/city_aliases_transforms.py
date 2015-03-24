from transforms import UpdateDataTransform

class CityAliasesTransforms:

    def __init__(self, _db):
        self._db = _db

    def get_transforms(self):
        transforms = []
        country_aliases = [
            ['M&#252;nchen', 'Munchen'],
            ['Unterf&#246;hring', 'Unterfohring'],
            ['D&#252;sseldorf', 'Dusseldorf'],
            ['G&#246;teborg', 'Goteborg'],
            ['Gr&#228;felfing', 'Grafelfing'],
            ['SouthSanFrancisco', 'SanFrancisco'],
            ['Londres', 'London'],
            ['Londra', 'London'],
            ['0stanbul', 'Instanbul'],
            ['M&#246;lnlycke', 'Mölnlycke'],
            ['V&#228;xj&#246;', 'Växjö'],
            ['V&#228;ster&#229;s', 'Västerås'],
            ['N&#252;rnberg', 'Nurnberg'],
            ['Z&#252;rich', 'Zurich'],
            ['CorkAirportBusinessPark', 'Cork'],
            ['Malm&#246;', 'Malmo'],
            ['K&#246;ln', 'Cologne'],
            ['&#39;s-Hertogenbosch', 'sHertogenbosch'],
            ['S&#246;dert&#228;lje', 'Södertälje'],
            ['JeleniaG&#243;ra', 'JeleniaGora'],
            ['DenHaag', 'TheHague'],
            ['AmsterdamZuid-Oost', 'Amsterdam'],
            ['Gr&#246;dig', 'Grödig'],
            ['K&#248;benhavn', 'Copenhagen'],
            ['H&#228;meenlinna', 'Hameenlinna'],
            ['Warszawa', 'Warsaw'],
            ['Krak&#243;w', 'Krakow'],
            ['M&#246;nchengladbach', 'Monchengaldbach'],
            ['SantCugatdelVall&#232;s', 'SantCugatdelValles'],
            ['Ta&#39;Xbiex', 'TaXbiex'],
            ['Helsingfors', 'Helsinki'],
        ]
        for country_alias in country_aliases:
            transforms.append(UpdateDataTransform(self._db, '''
                update opening
                set city = '%s'
                where city = '%s';
            ''' % (country_alias[1], country_alias[0])))
        return transforms