import os
import json

sentiment_file_name = os.path.join('.', 'AFINN', 'AFINN-111.txt')
sentiment_json_file_name = os.path.join('.', 'afinn-111.json')

sentiments = {}

with open(sentiment_file_name) as f:
    for line in f:
        word, sentiment = line.strip().split('\t')
        sentiments[word] = int(sentiment)

with open(sentiment_json_file_name, 'w') as f:
    json.dump(sentiments, f, sort_keys=True, indent=2)