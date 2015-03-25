from transforms import UpdateDataTransform
from db import Database

class SkillAliasesTransforms:

    def __init__(self, _db):
        self._db = _db

    def get_transforms(self):
        transforms = []
        aliases = [
            ['xhtml5', 'html'],
            ['xhtml', 'html'],
            ['xhtmlxml', 'html'],
            ['html5', 'html']
        ]
        for alias in aliases:
            alias_id = self._db.execute("select id from skill where name = '%s'" % (alias[0]))
            if len(alias_id) > 0:
                alias_id = alias_id[0][0]
            else:
                print("Skill alias id for '%s' not found" % (alias[0]))
                continue
            real_id = self._db.execute("select id from skill where name = '%s'" % (alias[1]))[0][0]
            if len(real_id) > 0:
                real_id = real_id[0][0]
            else:
                print("Skill real id for '%s' not found" % (alias[1]))
                continue
            transforms.append(UpdateDataTransform(self._db, '''
                update opening_skill
                set skill_id = %s
                where skill_id = %s;
            ''' % (real_id, alias_id)))
            transforms.append(UpdateDataTransform(self._db, '''
                delete from skill
                where id = %s;
            ''' % (alias_id)))
        return transforms

if __name__ == "__main__":
    db = Database()
    db.connect()

    transform_batches = [SkillAliasesTransforms(db)]

    for transform_batch in transform_batches:
        for transform in transform_batch.get_transforms():
            transform.run()

    db.close()