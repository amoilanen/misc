import sqlite3

DB_NAME = 'careers.db'

class Database:

    def __init__(self):
        self._connection = None
        self._cursor = None

    def connect(self):
        self._connection = sqlite3.connect(DB_NAME)
        self._cursor = self._connection.cursor()
        return self

    def create(self):
        self._cursor.execute('''CREATE TABLE opening(id integer, title text, url text, city text, country text)''')
        self._cursor.execute('''CREATE TABLE skill(id integer, name text)''')
        self._cursor.execute('''CREATE TABLE opening_skill(opening_id integer, skill_id integer)''')
        return self

    def store_skills(self, skills):
        rows = []
        for idx, skill in enumerate(skills):
            rows.append([idx, skill])
        self._cursor.executemany('INSERT INTO skill VALUES (?,?)', rows)
        self._connection.commit()

    def store_opening(self, opening_id, title, url, city, country, skill_ids):
        self._cursor.execute('INSERT INTO opening VALUES (?,?,?,?,?)', [opening_id, title, url, city, country])
        self._cursor.executemany('INSERT INTO opening_skill VALUES (?,?)', [[opening_id, skill_id] for skill_id in skill_ids])
        self._connection.commit()

    def close(self):
        self._connection.close()
        return self