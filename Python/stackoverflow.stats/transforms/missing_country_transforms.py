from transforms import UpdateDataTransform

class MissingCountryTransforms:

    def __init__(self, _db):
        self._db = _db

    def get_transforms(self):
        transforms = []
        transforms.append(UpdateDataTransform(self._db, '''
            update opening
            set country = 'Luxembourg'
            where city = 'Luxembourg';
        '''))
        transforms.append(UpdateDataTransform(self._db, '''
            update opening
            set country = 'Finland',
                city = 'Helsinki'
            where city = 'Finland' or city = 'Suomi';
        '''))
        transforms.append(UpdateDataTransform(self._db, '''
            update opening
            set country = 'China',
                city = 'HongKong'
            where city = 'HongKong';
        '''))
        transforms.append(UpdateDataTransform(self._db, '''
            update opening
            set country = 'Poland',
                city = 'Wroclaw'
            where city = 'Wroc';
        '''))
        transforms.append(UpdateDataTransform(self._db, '''
            update opening
            set country = 'Poland',
                city = 'Poznan'
            where city = 'Pozna';
        '''))
        transforms.append(UpdateDataTransform(self._db, '''
            update opening
            set country = 'Poland',
                city = 'Gdansk'
            where city = 'Gda';
        '''))
        transforms.append(UpdateDataTransform(self._db, '''
            update opening
            set country = 'CzechRepublic',
                city = 'Prague'
            where city = 'Praha' or city = 'Prague';
        '''))
        transforms.append(UpdateDataTransform(self._db, '''
            update opening
            set country = 'CzechRepublic',
                city = 'Brno'
            where city = 'Brno';
        '''))
        transforms.append(UpdateDataTransform(self._db, '''
            update opening
            set country = 'Singapore',
                city = 'Singapore'
            where city = 'Singapore';
        '''))
        transforms.append(UpdateDataTransform(self._db, '''
            update opening
            set country = 'Romania',
                city = 'Iasi'
            where city = 'Ia';
        '''))
        return transforms