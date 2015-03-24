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

class TransformBatch:

    def get_transforms(self):
        pass