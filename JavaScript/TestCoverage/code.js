(function(host) {

  var dictionary = {
    "key1": "value1",
    "key2": "value2",
    "key3": "value3"
  };

  //Broken implementation
  function getValuesBroken(keys) {
    return ["value1", "value2", "value3"];
  }

  function getValues(keys) {
    return keys.map(function(key) {
      return dictionary[key];
    });
  }

  //Expects malformed input
  function getValuesCautious(keys) {
    return keys ? keys.map(function(key) {
      return dictionary[key];
    }) : [];
  }

  var exported = {
    getValues: getValues,
    getValuesBroken: getValuesBroken,
    getValuesCautious: getValuesCautious
  };
  if (module && module.exports) {
    module.exports = exported;
  } else {
    host.Generator = exported;
  }
})(this);