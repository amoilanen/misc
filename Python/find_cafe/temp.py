    html = ''
    with open('response.html', 'r') as f:
        html = f.read()

    forecast = {
      'temperature': 1,
      'probabilityPrecipitation': 10,
      'precipitation1h': 0.0,
      'windSpeedMs': 5
    }

    history = json.dumps({
        '14.01.2015': NEPALESE,
        '15.01.2015': HIMA_SALI,
        '19.01.2015': NEPALESE,
        '20.01.2015': CHINESE
    }, sort_keys=True)