function merge() {
  var sources = [].slice.call(arguments);

  return sources.reduce(function(previous, source) {
    Object.keys(source).forEach(function(propertyName) {
      previous[propertyName] = source[propertyName];
    });
    return previous;
  }, {});
}

var obj1 = {
  'key1': 'value1',
  'key2': 'value2',
  'key3': 'value3'
};

var obj2 = {
  'key3': 'value3',
  'key4': 'value4',
  'key5': 'value5'
};

var obj3 = {
  'key6': 'value6'
}

merge(obj1, obj2, obj3);